package middleware

import (
	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
	"go.opentelemetry.io/otel/trace"

	"github.com/gin-gonic/gin"
)

const (
	traceIDKey = "trace_id"
	spanIDKey  = "span_id"
)

// Tracing wraps otelgin to extract W3C TraceContext from incoming headers,
// start a server span, and inject trace_id/span_id into the gin context
// so the logger middleware can include them in every log line.
func Tracing(serviceName string) gin.HandlerFunc {
	otelMiddleware := otelgin.Middleware(serviceName)
	return func(c *gin.Context) {
		otelMiddleware(c)
		// After otelgin has processed the context the span is active.
		span := trace.SpanFromContext(c.Request.Context())
		if span.SpanContext().IsValid() {
			c.Set(traceIDKey, span.SpanContext().TraceID().String())
			c.Set(spanIDKey, span.SpanContext().SpanID().String())
		}
	}
}

// GetTraceID reads the trace_id set by Tracing middleware from gin context.
func GetTraceID(c *gin.Context) string { return c.GetString(traceIDKey) }

// GetSpanID reads the span_id set by Tracing middleware from gin context.
func GetSpanID(c *gin.Context) string { return c.GetString(spanIDKey) }
