package middleware

import (
	"time"

	"auth-service/internal/pkg/logger"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		method := c.Request.Method
		requestId := c.GetString("requestId")
		traceID := c.GetString(traceIDKey)
		spanID := c.GetString(spanIDKey)

		logger.Info("→ request",
			zap.String("method", method),
			zap.String("path", path),
			zap.String("requestId", requestId),
			zap.String("trace_id", traceID),
			zap.String("span_id", spanID),
			zap.String("ip", c.ClientIP()),
		)

		c.Next()

		latency := time.Since(start)
		status := c.Writer.Status()

		fields := []zap.Field{
			zap.String("method", method),
			zap.String("path", path),
			zap.String("requestId", requestId),
			zap.String("trace_id", traceID),
			zap.String("span_id", spanID),
			zap.Int("status", status),
			zap.String("latency", latency.String()),
		}
		if uid, exists := c.Get("userID"); exists {
			fields = append(fields, zap.Any("userID", uid))
		}

		switch {
		case status >= 500:
			logger.Error("← response", fields...)
		case status >= 400:
			logger.Warn("← response", fields...)
		default:
			logger.Info("← response", fields...)
		}
	}
}
