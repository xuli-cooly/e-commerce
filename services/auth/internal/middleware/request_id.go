package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const RequestIDKey = "requestId"

func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.GetHeader("X-Request-ID")
		if id == "" {
			id = uuid.New().String()
		}
		c.Set(RequestIDKey, id)
		c.Header("X-Request-ID", id)
		c.Next()
	}
}

// Helpers for handlers to read ctx values safely.
func GetRequestID(c *gin.Context) string { return c.GetString(RequestIDKey) }
func GetUserID(c *gin.Context) int64     { v, _ := c.Get("userID"); id, _ := v.(int64); return id }
func GetRole(c *gin.Context) string      { return c.GetString("role") }
