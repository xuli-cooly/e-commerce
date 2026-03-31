package logger

import (
	"context"
	"os"

	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gopkg.in/natefinch/lumberjack.v2"
)

var Log *zap.Logger

// LogConfig mirrors config.LogConfig to avoid an import cycle.
type LogConfig struct {
	Level      string
	FilePath   string
	MaxSizeMB  int
	MaxBackups int
	MaxAgeDays int
	Compress   bool
	Env        string
}

func Init(cfg LogConfig) {
	level := parseLevel(cfg.Level)

	if cfg.Env == "production" {
		encoderCfg := zap.NewProductionEncoderConfig()
		encoderCfg.TimeKey = "time"
		encoderCfg.EncodeTime = zapcore.ISO8601TimeEncoder

		jsonEncoder := zapcore.NewJSONEncoder(encoderCfg)

		var cores []zapcore.Core

		// Always write to stdout.
		cores = append(cores, zapcore.NewCore(jsonEncoder, zapcore.AddSync(os.Stdout), level))

		// Write to rotating file when file_path is set.
		if cfg.FilePath != "" {
			rotator := &lumberjack.Logger{
				Filename:   cfg.FilePath,
				MaxSize:    cfg.MaxSizeMB,
				MaxBackups: cfg.MaxBackups,
				MaxAge:     cfg.MaxAgeDays,
				Compress:   cfg.Compress,
			}
			cores = append(cores, zapcore.NewCore(jsonEncoder, zapcore.AddSync(rotator), level))
		}

		Log = zap.New(zapcore.NewTee(cores...), zap.AddCaller(), zap.AddStacktrace(zapcore.ErrorLevel))
	} else {
		devCfg := zap.NewDevelopmentConfig()
		devCfg.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
		devCfg.OutputPaths = []string{"stdout"}
		l, err := devCfg.Build()
		if err != nil {
			panic(err)
		}
		Log = l
	}
}

func parseLevel(lvl string) zapcore.Level {
	switch lvl {
	case "debug":
		return zapcore.DebugLevel
	case "warn":
		return zapcore.WarnLevel
	case "error":
		return zapcore.ErrorLevel
	default:
		return zapcore.InfoLevel
	}
}

// WithContext returns a logger enriched with trace_id and span_id from an
// active OpenTelemetry span in ctx. Falls back to the global Log when no
// valid span is present.
func WithContext(ctx context.Context) *zap.Logger {
	span := trace.SpanFromContext(ctx)
	if !span.SpanContext().IsValid() {
		return Log
	}
	return Log.With(
		zap.String("trace_id", span.SpanContext().TraceID().String()),
		zap.String("span_id", span.SpanContext().SpanID().String()),
	)
}

func Info(msg string, fields ...zap.Field)  { Log.Info(msg, fields...) }
func Warn(msg string, fields ...zap.Field)  { Log.Warn(msg, fields...) }
func Error(msg string, fields ...zap.Field) { Log.Error(msg, fields...) }
func Fatal(msg string, fields ...zap.Field) { Log.Fatal(msg, fields...) }
