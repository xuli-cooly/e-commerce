package middleware

import (
	"strings"

	apperrors "auth-service/internal/pkg/errors"
	jwtpkg "auth-service/internal/pkg/jwt"
	"auth-service/internal/pkg/response"
	redisdb "auth-service/internal/repository/redis"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware validates Bearer JWT and injects userID/role/jti into context.
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			response.Fail(c, apperrors.ErrUnauthorized)
			return
		}
		tokenStr := strings.TrimPrefix(header, "Bearer ")

		claims, err := jwtpkg.ParseToken(tokenStr)
		if err != nil {
			response.Fail(c, apperrors.ErrUnauthorized)
			return
		}

		// Check Redis blacklist (only when Redis is available)
		if redisdb.Client != nil {
			blacklistKey := "token:blacklist:" + claims.ID
			exists, err := redisdb.Client.Exists(c.Request.Context(), blacklistKey).Result()
			if err == nil && exists > 0 {
				response.Fail(c, apperrors.ErrUnauthorized)
				return
			}
		}

		c.Set("userID", claims.UserID)
		c.Set("role", claims.Role)
		c.Set("jti", claims.ID)
		c.Next()
	}
}

// AdminMiddleware requires role == ADMIN. Must run after AuthMiddleware.
func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role := c.GetString("role")
		if role != "ADMIN" {
			response.Fail(c, apperrors.ErrForbidden)
			return
		}
		c.Next()
	}
}
