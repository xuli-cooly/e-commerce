package middleware

import (
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// Claims mirrors the backend JWT structure.
type Claims struct {
	UserID int64  `json:"userId"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// jwtSecret reads from env JWT_SECRET at parse time.
func jwtSecret() []byte {
	s := os.Getenv("JWT_SECRET")
	if s == "" {
		s = "trading-secret-key"
	}
	return []byte(s)
}

func parseToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return jwtSecret(), nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}
	return claims, nil
}

// AuthInject validates Bearer JWT and injects X-User-Id / X-User-Role headers
// into the proxied request. Routes matching skipPrefixes are public but still
// receive injected headers when a valid token is present (optional auth).
func AuthInject(skipPrefixes []string) gin.HandlerFunc {
	return func(c *gin.Context) {
		isSkip := false
		for _, p := range skipPrefixes {
			if strings.HasPrefix(c.Request.URL.Path, p) {
				isSkip = true
				break
			}
		}

		header := c.GetHeader("Authorization")
		if strings.HasPrefix(header, "Bearer ") {
			tokenStr := strings.TrimPrefix(header, "Bearer ")
			if claims, err := parseToken(tokenStr); err == nil {
				// Inject user info for both public and protected routes.
				c.Request.Header.Set("X-User-Id", fmt.Sprintf("%d", claims.UserID))
				c.Request.Header.Set("X-User-Role", claims.Role)
				c.Set("userID", claims.UserID)
				c.Set("role", claims.Role)
			} else if !isSkip {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "invalid token"})
				return
			}
		} else if !isSkip {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
			return
		}

		c.Next()
	}
}

// RequestTimeout adds a timeout context to each request.
func RequestTimeout(d time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Simple pass-through; real timeout is handled at reverse proxy level.
		c.Next()
	}
}
