// @title           Trading System API
// @version         1.0
// @description     电商交易系统 REST API
// @host            localhost:8080
// @BasePath        /api/v1
// @securityDefinitions.apikey ApiKeyAuth
// @in header
// @name Authorization
// @description Bearer <token>
package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"trading-service/config"
	_ "trading-service/docs"
	"trading-service/internal/handler"
	"trading-service/internal/middleware"
	"trading-service/internal/mq"
	jwtpkg "trading-service/internal/pkg/jwt"
	"trading-service/internal/pkg/logger"
	"trading-service/internal/pkg/response"
	"trading-service/internal/pkg/tracing"
	"trading-service/internal/repository"
	esrepo "trading-service/internal/repository/es"
	mysqlrepo "trading-service/internal/repository/mysql"
	redisrepo "trading-service/internal/repository/redis"
	"trading-service/internal/service"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func main() {
	// 1. Load local yaml (Nacos overlay happens inside Load if enabled).
	config.Load("config/config.yaml")
	cfg := config.Global

	// 2. Logger (must come before any logger.* calls).
	logger.Init(logger.LogConfig{
		Env:        cfg.App.Env,
		Level:      cfg.Log.Level,
		FilePath:   cfg.Log.FilePath,
		MaxSizeMB:  cfg.Log.MaxSizeMB,
		MaxBackups: cfg.Log.MaxBackups,
		MaxAgeDays: cfg.Log.MaxAgeDays,
		Compress:   cfg.Log.Compress,
	})

	// 3. OpenTelemetry tracing.
	var tracingShutdown func(context.Context)
	if cfg.Tracing.Enabled {
		shutdown, err := tracing.Init(cfg.Tracing.ServiceName, cfg.Tracing.JaegerEndpoint)
		if err != nil {
			logger.Warn("tracing init failed: " + err.Error())
		} else {
			tracingShutdown = shutdown
			logger.Info("tracing enabled → " + cfg.Tracing.JaegerEndpoint)
		}
	}

	// 4. JWT.
	jwtpkg.Init(cfg.JWT.Secret, cfg.JWT.ExpireDays)

	// 5. Data stores.
	if err := mysqlrepo.Init(&cfg.DB); err != nil {
		log.Fatalf("mysql init: %v", err)
	}
	db := mysqlrepo.DB

	if err := redisrepo.Init(&cfg.Redis); err != nil {
		logger.Warn("redis unavailable, cache disabled: " + err.Error())
	}

	if err := esrepo.Init(&cfg.Elasticsearch); err != nil {
		logger.Warn("elasticsearch unavailable, search degraded: " + err.Error())
	}

	if err := mq.Init(&cfg.RabbitMQ); err != nil {
		logger.Warn("rabbitmq unavailable, mq disabled: " + err.Error())
	} else {
		mq.StartConsumers(&cfg.RabbitMQ)
	}

	// 6. Repositories.
	productRepo  := mysqlrepo.NewProductRepo(db)
	categoryRepo := mysqlrepo.NewCategoryRepo(db)
	orderRepo    := mysqlrepo.NewOrderRepo(db)
	cartRepo     := mysqlrepo.NewCartRepo(db)
	statsRepo    := mysqlrepo.NewStatsRepo(db)
	favoriteRepo := mysqlrepo.NewFavoriteRepo(db)
	reviewRepo   := mysqlrepo.NewReviewRepo(db)

	var searchRepo repository.SearchRepo
	var cacheRepo  repository.CacheRepo

	if esrepo.Client != nil {
		sr := esrepo.NewSearchRepo(esrepo.Client, &cfg.Elasticsearch)
		if err := sr.EnsureIndex(context.Background()); err != nil {
			logger.Warn("es ensure index: " + err.Error())
		}
		searchRepo = sr
	} else {
		searchRepo = mysqlrepo.NewNoopSearch(productRepo)
	}

	if redisrepo.Client != nil {
		cacheRepo = redisrepo.NewCacheRepo(redisrepo.Client)
	} else {
		cacheRepo = &mysqlrepo.NoopCache{}
	}

	// 7. Services.
	productSvc  := service.NewProductService(productRepo, categoryRepo, searchRepo, cacheRepo)
	orderSvc    := service.NewOrderService(orderRepo, productRepo, cartRepo, cacheRepo)
	cartSvc     := service.NewCartService(cartRepo, productRepo)
	statsSvc    := service.NewStatsService(statsRepo)
	favoriteSvc := service.NewFavoriteService(favoriteRepo)
	reviewSvc   := service.NewReviewService(reviewRepo)

	// 8. Handlers.
	productHandler  := handler.NewProductHandler(productSvc)
	orderHandler    := handler.NewOrderHandler(orderSvc)
	cartHandler     := handler.NewCartHandler(cartSvc)
	statsHandler    := handler.NewStatsHandler(statsSvc)
	favoriteHandler := handler.NewFavoriteHandler(favoriteSvc)
	reviewHandler   := handler.NewReviewHandler(reviewSvc)
	internalHandler := handler.NewInternalHandler(productSvc)

	// 9. Gin router.
	if cfg.App.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.New()

	// Tracing middleware must come first so trace_id is set before Logger runs.
	if cfg.Tracing.Enabled {
		r.Use(middleware.Tracing(cfg.Tracing.ServiceName))
	}
	r.Use(middleware.CORS(), middleware.RequestID(), middleware.Logger(), middleware.Recovery())

	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	r.GET("/health", func(c *gin.Context) { response.Success(c, gin.H{"status": "ok"}) })

	v1 := r.Group("/api/v1")
	{
		v1.GET("/products", productHandler.ListProducts)
		v1.GET("/products/:id", productHandler.GetProduct)
		v1.GET("/products/:id/reviews", reviewHandler.ListReviews)
		v1.GET("/products/:id/reviews/stats", reviewHandler.GetReviewStats)
		v1.GET("/categories", productHandler.ListCategories)

		authed := v1.Group("", middleware.AuthMiddleware())
		authed.GET("/orders", orderHandler.ListOrders)
		authed.POST("/orders", orderHandler.CreateOrder)
		authed.POST("/orders/:id/pay", orderHandler.PayOrder)
		authed.GET("/cart", cartHandler.GetCart)
		authed.POST("/cart/items", cartHandler.AddCartItem)
		authed.DELETE("/cart/items/:id", cartHandler.DeleteCartItem)
		authed.POST("/favorites", favoriteHandler.ToggleFavorite)
		authed.GET("/favorites", favoriteHandler.ListFavorites)
		authed.GET("/favorites/check", favoriteHandler.CheckFavorite)
		authed.POST("/products/:id/reviews", reviewHandler.CreateReview)

		admin := v1.Group("/admin", middleware.AuthMiddleware(), middleware.AdminMiddleware())
		admin.GET("/products", productHandler.AdminListProducts)
		admin.POST("/products", productHandler.AdminCreateProduct)
		admin.PUT("/products/:id", productHandler.AdminUpdateProduct)
		admin.GET("/orders", orderHandler.AdminListOrders)
		admin.PUT("/orders/:id/status", orderHandler.AdminUpdateOrderStatus)
		admin.GET("/stats", statsHandler.GetStats)
		admin.GET("/categories", productHandler.AdminListCategories)
		admin.POST("/categories", productHandler.AdminCreateCategory)
		admin.PUT("/categories/:id", productHandler.AdminUpdateCategory)
		admin.DELETE("/categories/:id", productHandler.AdminDeleteCategory)
	}

	// Internal routes — for service-to-service calls (not exposed via Gateway).
	internal := r.Group("/internal")
	internal.GET("/products", internalHandler.InternalGetProducts)

	// 10. Nacos service registration.
	var nacosClients *config.NacosClients
	if cfg.Nacos.Enabled {
		var err error
		nacosClients, err = config.NewNacosClients(&cfg.Nacos)
		if err != nil {
			logger.Warn("nacos init failed: " + err.Error())
		} else {
			nacosClients.Register()
		}
	}

	// 11. Start HTTP server in a goroutine.
	addr := fmt.Sprintf(":%d", cfg.App.Port)
	srv := &http.Server{
		Addr:    addr,
		Handler: r,
	}

	go func() {
		logger.Info("server starting on " + addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server: %v", err)
		}
	}()

	// 12. Block until SIGTERM or SIGINT.
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGTERM, syscall.SIGINT)
	<-quit
	logger.Info("shutting down…")

	// 13. Graceful shutdown sequence.
	if nacosClients != nil {
		nacosClients.Deregister()
	}

	if tracingShutdown != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		tracingShutdown(ctx)
	}

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("http server shutdown: %v", err)
	}

	logger.Info("server stopped")
}
