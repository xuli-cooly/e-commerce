package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"community-service/internal/handler"
	mysqlrepo "community-service/internal/repository/mysql"
	"community-service/internal/service"

	"github.com/gin-gonic/gin"
)

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func main() {
	dsn := getenv("COMMUNITY_DB_DSN", "root:Trading@2026#Secure@tcp(localhost:3306)/community?charset=utf8mb4&parseTime=True&loc=Local")
	port := getenv("COMMUNITY_PORT", "8003")

	if err := mysqlrepo.Init(dsn); err != nil {
		log.Fatalf("db init: %v", err)
	}

	postRepo := mysqlrepo.NewPostRepo(mysqlrepo.DB)
	likeRepo := mysqlrepo.NewPostLikeRepo(mysqlrepo.DB)
	postSvc := service.NewPostService(postRepo, likeRepo)
	postHandler := handler.NewPostHandler(postSvc)

	r := gin.New()
	r.Use(gin.Recovery())

	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Authorization,Content-Type,X-User-Id,X-User-Role")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	// Serve uploaded static files.
	r.Static("/static", "./static")

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "community"})
	})

	v1 := r.Group("/api/v1")
	{
		// Public.
		v1.GET("/posts", postHandler.ListPosts)
		v1.GET("/posts/:id", postHandler.GetPost)

		// Authenticated (X-User-Id injected by gateway).
		v1.POST("/posts", postHandler.CreatePost)
		v1.POST("/posts/:id/like", postHandler.ToggleLike)
		v1.DELETE("/posts/:id", postHandler.DeletePost)
		v1.POST("/upload", handler.Upload)

		// Admin.
		admin := v1.Group("/admin")
		admin.GET("/posts", postHandler.AdminListPosts)
		admin.PATCH("/posts/:id", postHandler.AdminUpdatePost)
		admin.DELETE("/posts/:id", postHandler.AdminDeletePost)
	}

	addr := fmt.Sprintf(":%s", port)
	log.Printf("community-service listening on %s", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("server: %v", err)
	}
}
