package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
)

func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID")
		c.Header("Access-Control-Expose-Headers", "X-Request-ID")
		c.Header("Access-Control-Max-Age", "86400")
		c.Header("Cache-Control", "no-store")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

// parsePage normalises page/size query params with safe defaults.
func parsePage(pageStr, sizeStr string) (int, int) {
	page, size := 1, 20
	if p := parseInt(pageStr); p >= 1 {
		page = p
	}
	if s := parseInt(sizeStr); s >= 1 && s <= 100 {
		size = s
	}
	return page, size
}

func parseInt(s string) int {
	n := 0
	for _, c := range s {
		if c < '0' || c > '9' {
			return 0
		}
		n = n*10 + int(c-'0')
	}
	return n
}

// unused reference to time to satisfy go vet if needed later
var _ = time.Now
