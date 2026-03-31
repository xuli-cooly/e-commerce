package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"gateway/internal/middleware"
	"gateway/internal/proxy"

	"github.com/gin-gonic/gin"
)

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func main() {
	port := getenv("PORT", "8000")

	// Upstream service addresses.
	authURL      := getenv("AUTH_SERVICE_URL", "http://localhost:8001")
	tradingURL   := getenv("TRADING_SERVICE_URL", "http://localhost:8002")
	communityURL := getenv("COMMUNITY_SERVICE_URL", "http://localhost:8003")

	auth      := proxy.NewUpstream(authURL)
	trading   := proxy.NewUpstream(tradingURL)
	community := proxy.NewUpstream(communityURL)

	// Paths that don't require JWT validation.
	skipPrefixes := []string{
		"/api/v1/auth/",
		"/api/v1/products",   // public product listing
		"/api/v1/categories", // public categories
		"/api/v1/posts",      // public post listing
		"/static/",
		"/health",
		"/swagger/",
	}

	r := gin.New()
	r.Use(gin.Recovery())

	// CORS — allow all origins for dev.
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Authorization,Content-Type,X-Requested-With")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	r.Use(middleware.AuthInject(skipPrefixes))

	// Route rules — all traffic goes through a single catch-all handler.
	communityPrefixes := []string{
		"/api/v1/posts",
		"/api/v1/upload",
		"/api/v1/admin/posts",
		"/api/v1/admin/community",
		"/static/",
	}

	r.Any("/*path", func(c *gin.Context) {
		path := c.Request.URL.Path
		// Health check.
		if path == "/health" {
			c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "gateway"})
			return
		}
		// Auth routes → auth-service.
		if strings.HasPrefix(path, "/api/v1/auth/") {
			auth.Handler()(c)
			return
		}
		// Community routes (posts / upload / static) → community-service.
		for _, p := range communityPrefixes {
			if strings.HasPrefix(path, p) {
				community.Handler()(c)
				return
			}
		}
		// Default: trading service.
		trading.Handler()(c)
	})

	addr := fmt.Sprintf(":%s", port)
	log.Printf("gateway listening on %s  auth→%s  trading→%s  community→%s", addr, authURL, tradingURL, communityURL)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("gateway: %v", err)
	}
}
