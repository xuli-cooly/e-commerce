package handler

import (
	"strconv"

	apperrors "auth-service/internal/pkg/errors"
	"auth-service/internal/pkg/response"

	"github.com/gin-gonic/gin"
)

func parsePageQuery(c *gin.Context) (int, int) {
	page, size := 1, 20
	if p, err := strconv.Atoi(c.Query("page")); err == nil && p >= 1 {
		page = p
	}
	if s, err := strconv.Atoi(c.Query("size")); err == nil && s >= 1 && s <= 100 {
		size = s
	}
	return page, size
}

func getContextUserID(c *gin.Context) int64 {
	v, _ := c.Get("userID")
	id, _ := v.(int64)
	return id
}

// failErr converts an error to *apperrors.AppError and calls response.Fail.
// If the error is already an *apperrors.AppError it is used directly;
// otherwise ErrInternal is used.
func failErr(c *gin.Context, err error) {
	if appErr, ok := err.(*apperrors.AppError); ok {
		response.Fail(c, appErr)
		return
	}
	response.Fail(c, apperrors.ErrInternal.WithErr(err))
}
