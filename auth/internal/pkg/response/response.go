package response

import (
	"net/http"

	apperrors "auth-service/internal/pkg/errors"
	"auth-service/internal/pkg/logger"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type body struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Data    any    `json:"data"`
}

type PageData struct {
	List  any   `json:"list"`
	Total int64 `json:"total"`
	Page  int   `json:"page"`
	Size  int   `json:"size"`
}

// Success responds with code 1000 and data.
func Success(c *gin.Context, data any) {
	c.JSON(http.StatusOK, body{Code: 1000, Message: "success", Data: data})
}

// SuccessList responds with a paginated list.
func SuccessList(c *gin.Context, list any, total int64, page, size int) {
	Success(c, PageData{List: list, Total: total, Page: page, Size: size})
}

// Fail responds with the AppError's HTTP status and business code.
// Internal Err is logged but never sent to the client.
func Fail(c *gin.Context, err *apperrors.AppError) {
	if err.Err != nil {
		logger.Error("request error",
			zap.Int("code", err.Code),
			zap.String("message", err.Message),
			zap.String("requestId", c.GetString("requestId")),
			zap.Error(err.Err),
		)
	}
	c.JSON(err.HTTPStatus, body{Code: err.Code, Message: err.Message, Data: nil})
	c.Abort()
}
