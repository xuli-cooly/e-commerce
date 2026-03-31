package handler

import (
	"net/http"
	"strconv"

	"community-service/internal/model/entity"
	"community-service/internal/pkg/response"
	"community-service/internal/repository/mysql"

	"github.com/gin-gonic/gin"
)

// AdminListPosts GET /api/v1/admin/posts
func (h *PostHandler) AdminListPosts(c *gin.Context) {
	if c.GetHeader("X-User-Role") != "ADMIN" {
		response.Fail(c, http.StatusForbidden, "forbidden")
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "20"))
	status := c.DefaultQuery("status", "")

	params := mysql.ListPostsParams{
		Sort:   "latest",
		Status: status,
		Page:   page,
		Size:   size,
	}
	if params.Status == "" {
		params.Status = "all"
	}

	posts, total, err := h.svc.AdminList(c.Request.Context(), params)
	if err != nil {
		response.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}
	if posts == nil {
		posts = []*entity.Post{}
	}
	response.Success(c, gin.H{"list": posts, "total": total})
}

// AdminUpdatePost PATCH /api/v1/admin/posts/:id
func (h *PostHandler) AdminUpdatePost(c *gin.Context) {
	if c.GetHeader("X-User-Role") != "ADMIN" {
		response.Fail(c, http.StatusForbidden, "forbidden")
		return
	}
	postID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.Fail(c, http.StatusBadRequest, "invalid id")
		return
	}
	var req struct {
		Status string `json:"status" binding:"required,oneof=active removed"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	if err := h.svc.AdminUpdateStatus(c.Request.Context(), postID, req.Status); err != nil {
		response.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.Success(c, nil)
}

// AdminDeletePost DELETE /api/v1/admin/posts/:id
func (h *PostHandler) AdminDeletePost(c *gin.Context) {
	if c.GetHeader("X-User-Role") != "ADMIN" {
		response.Fail(c, http.StatusForbidden, "forbidden")
		return
	}
	postID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.Fail(c, http.StatusBadRequest, "invalid id")
		return
	}
	if err := h.svc.AdminHardDelete(c.Request.Context(), postID); err != nil {
		response.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.Success(c, nil)
}
