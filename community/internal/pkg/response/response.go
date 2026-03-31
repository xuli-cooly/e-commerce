package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type envelope struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Data    any    `json:"data,omitempty"`
}

func Success(c *gin.Context, data any) {
	c.JSON(http.StatusOK, envelope{Code: 0, Message: "success", Data: data})
}

func Fail(c *gin.Context, statusCode int, msg string) {
	c.AbortWithStatusJSON(statusCode, envelope{Code: statusCode, Message: msg})
}
