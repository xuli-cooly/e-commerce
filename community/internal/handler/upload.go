package handler

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"community-service/internal/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

var allowedExts = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".gif":  true,
	".webp": true,
}

// Upload POST /api/v1/upload
func Upload(c *gin.Context) {
	if getViewerID(c) == 0 {
		response.Fail(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		response.Fail(c, http.StatusBadRequest, "file required")
		return
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if !allowedExts[ext] {
		response.Fail(c, http.StatusBadRequest, "unsupported file type")
		return
	}

	// Directory: ./static/uploads/YYYYMMDD/
	dateDir := time.Now().Format("20060102")
	uploadDir := filepath.Join("static", "uploads", dateDir)
	if err := os.MkdirAll(uploadDir, 0o755); err != nil {
		response.Fail(c, http.StatusInternalServerError, "storage error")
		return
	}

	filename := uuid.New().String() + ext
	dest := filepath.Join(uploadDir, filename)

	if err := c.SaveUploadedFile(header, dest); err != nil {
		response.Fail(c, http.StatusInternalServerError, "save error")
		return
	}

	relURL := fmt.Sprintf("/static/uploads/%s/%s", dateDir, filename)
	response.Success(c, gin.H{"url": relURL})
}
