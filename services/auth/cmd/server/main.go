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

	"auth-service/config"
	"auth-service/internal/handler"
	"auth-service/internal/middleware"
	jwtpkg "auth-service/internal/pkg/jwt"
	"auth-service/internal/pkg/logger"
	"auth-service/internal/pkg/response"
	mysqlrepo "auth-service/internal/repository/mysql"
	redisrepo "auth-service/internal/repository/redis"
	"auth-service/internal/service"

	"github.com/gin-gonic/gin"
)

func main() {
	// 1. Config.
	config.Load("config/config.yaml")
	cfg := config.Global

	// 2. Logger.
	logger.Init(logger.LogConfig{
		Env:        cfg.App.Env,
		Level:      cfg.Log.Level,
		FilePath:   cfg.Log.FilePath,
		MaxSizeMB:  cfg.Log.MaxSizeMB,
		MaxBackups: cfg.Log.MaxBackups,
		MaxAgeDays: cfg.Log.MaxAgeDays,
		Compress:   cfg.Log.Compress,
	})

	// 3. JWT.
	jwtpkg.Init(cfg.JWT.Secret, cfg.JWT.ExpireDays)

	// 4. MySQL.
	if err := mysqlrepo.Init(&cfg.DB); err != nil {
		log.Fatalf("mysql init: %v", err)
	}
	db := mysqlrepo.DB

	// 5. Redis (optional).
	if err := redisrepo.Init(&cfg.Redis); err != nil {
		logger.Warn("redis unavailable, cache disabled: " + err.Error())
	}

	// 6. Repositories.
	userRepo := mysqlrepo.NewUserRepo(db)

	// 7. Services.
	authSvc := service.NewAuthService(userRepo)

	// 8. Handler.
	authHandler := handler.NewAuthHandler(authSvc)
	internalHandler := handler.NewInternalHandler(userRepo)

	// 9. Router.
	if cfg.App.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.New()
	r.Use(middleware.CORS(), middleware.RequestID(), middleware.Logger(), middleware.Recovery())

	r.GET("/health", func(c *gin.Context) { response.Success(c, gin.H{"status": "ok"}) })

	// Internal routes — service-to-service only, no JWT required.
	internal := r.Group("/internal")
	internal.GET("/users", internalHandler.GetUsers)

	v1 := r.Group("/api/v1")
	{
		auth := v1.Group("/auth")
		auth.POST("/send-code", authHandler.SendCode)
		auth.POST("/login", authHandler.Login)
		auth.POST("/password-login", authHandler.PasswordLogin)
		auth.POST("/admin/login", authHandler.AdminLogin)
		auth.POST("/logout", middleware.AuthMiddleware(), authHandler.Logout)

		authed := v1.Group("", middleware.AuthMiddleware())
		authed.POST("/auth/set-password", authHandler.SetPassword)
	}

	// 10. Start HTTP server.
	addr := fmt.Sprintf(":%d", cfg.App.Port)
	srv := &http.Server{Addr: addr, Handler: r}

	go func() {
		logger.Info("auth-service starting on " + addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server: %v", err)
		}
	}()

	// 11. Graceful shutdown.
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGTERM, syscall.SIGINT)
	<-quit
	logger.Info("shutting down…")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("shutdown: %v", err)
	}
	logger.Info("auth-service stopped")
}
