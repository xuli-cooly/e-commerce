package handler

import (
	"strconv"
	"strings"

	apperrors "auth-service/internal/pkg/errors"
	"auth-service/internal/pkg/response"
	"auth-service/internal/repository"

	"github.com/gin-gonic/gin"
)

type InternalHandler struct {
	userRepo repository.UserRepo
}

func NewInternalHandler(userRepo repository.UserRepo) *InternalHandler {
	return &InternalHandler{userRepo: userRepo}
}

// GetUsers handles GET /internal/users?ids=1,2,3
func (h *InternalHandler) GetUsers(c *gin.Context) {
	idsStr := c.Query("ids")
	if idsStr == "" {
		response.Fail(c, apperrors.ErrInvalidParams)
		return
	}

	parts := strings.Split(idsStr, ",")
	ids := make([]int64, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		id, err := strconv.ParseInt(p, 10, 64)
		if err != nil {
			continue
		}
		ids = append(ids, id)
	}

	if len(ids) == 0 {
		response.Fail(c, apperrors.ErrInvalidParams)
		return
	}

	users, err := h.userRepo.FindByIDs(c.Request.Context(), ids)
	if err != nil {
		response.Fail(c, apperrors.ErrInternal.WithErr(err))
		return
	}

	type userInfo struct {
		ID    int64  `json:"id"`
		Phone string `json:"phone"`
		Role  string `json:"role"`
	}
	result := make([]userInfo, 0, len(users))
	for _, u := range users {
		result = append(result, userInfo{ID: u.ID, Phone: u.Phone, Role: u.Role})
	}
	response.Success(c, result)
}
