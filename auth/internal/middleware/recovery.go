package middleware

import (
	"fmt"
	"runtime/debug"

	apperrors "auth-service/internal/pkg/errors"
	"auth-service/internal/pkg/logger"
	"auth-service/internal/pkg/response"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func Recovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if r := recover(); r != nil {
				logger.Error("panic recovered",
					zap.String("requestId", c.GetString("requestId")),
					zap.String("panic", fmt.Sprintf("%v", r)),
					zap.String("stack", string(debug.Stack())),
				)
				response.Fail(c, apperrors.ErrInternal)
			}
		}()
		c.Next()
	}
}
