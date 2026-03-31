package handler

import (
	"net/http"
	"strconv"

	"community-service/internal/model/entity"
	"community-service/internal/pkg/response"
	"community-service/internal/repository/mysql"
	"community-service/internal/service"

	"github.com/gin-gonic/gin"
)

type PostHandler struct{ svc *service.PostService }

func NewPostHandler(svc *service.PostService) *PostHandler { return &PostHandler{svc: svc} }

// getViewerID extracts the authenticated user ID from X-User-Id header (set by gateway).
func getViewerID(c *gin.Context) int64 {
	id, _ := strconv.ParseInt(c.GetHeader("X-User-Id"), 10, 64)
	return id
}

func mustUserID(c *gin.Context) (int64, bool) {
	id := getViewerID(c)
	if id == 0 {
		response.Fail(c, http.StatusUnauthorized, "unauthorized")
		return 0, false
	}
	return id, true
}

// CreatePost POST /api/v1/posts
func (h *PostHandler) CreatePost(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	var req struct {
		Title      string  `json:"title" binding:"required"`
		Content    string  `json:"content"`
		ImageURLs  []string `json:"image_urls"`
		ProductIDs []int64  `json:"product_ids"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	post, err := h.svc.Create(c.Request.Context(), userID, req.Title, req.Content, req.ImageURLs, req.ProductIDs)
	if err != nil {
		response.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.Success(c, post)
}

// GetPost GET /api/v1/posts/:id
func (h *PostHandler) GetPost(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.Fail(c, http.StatusBadRequest, "invalid id")
		return
	}
	viewerID := getViewerID(c)
	post, err := h.svc.GetByID(c.Request.Context(), id, viewerID)
	if err != nil {
		response.Fail(c, http.StatusNotFound, "post not found")
		return
	}
	response.Success(c, post)
}

// ListPosts GET /api/v1/posts
func (h *PostHandler) ListPosts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "20"))
	sort := c.DefaultQuery("sort", "latest")

	params := mysql.ListPostsParams{
		Sort:   sort,
		Status: "active",
		Page:   page,
		Size:   size,
	}
	if pidStr := c.Query("product_id"); pidStr != "" {
		if pid, err := strconv.ParseInt(pidStr, 10, 64); err == nil {
			params.ProductID = &pid
		}
	}

	viewerID := getViewerID(c)
	posts, total, err := h.svc.List(c.Request.Context(), params, viewerID)
	if err != nil {
		response.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}
	if posts == nil {
		posts = []*entity.Post{}
	}
	response.Success(c, gin.H{"list": posts, "total": total})
}

// ToggleLike POST /api/v1/posts/:id/like
func (h *PostHandler) ToggleLike(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}
	postID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.Fail(c, http.StatusBadRequest, "invalid id")
		return
	}
	liked, likeCount, err := h.svc.ToggleLike(c.Request.Context(), postID, userID)
	if err != nil {
		response.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.Success(c, gin.H{"is_liked": liked, "like_count": likeCount})
}

// DeletePost DELETE /api/v1/posts/:id
func (h *PostHandler) DeletePost(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}
	postID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.Fail(c, http.StatusBadRequest, "invalid id")
		return
	}
	if err := h.svc.SoftDelete(c.Request.Context(), postID, userID); err != nil {
		if err.Error() == "forbidden" {
			response.Fail(c, http.StatusForbidden, "forbidden")
		} else {
			response.Fail(c, http.StatusInternalServerError, err.Error())
		}
		return
	}
	response.Success(c, nil)
}
