package service

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"

	"community-service/internal/model/entity"
	"community-service/internal/repository/mysql"
)

type PostService struct {
	postRepo     *mysql.PostRepo
	likeRepo     *mysql.PostLikeRepo
	tradingURL   string
}

func NewPostService(postRepo *mysql.PostRepo, likeRepo *mysql.PostLikeRepo) *PostService {
	tradingURL := os.Getenv("TRADING_SERVICE_URL")
	if tradingURL == "" {
		tradingURL = "http://localhost:8002"
	}
	return &PostService{postRepo: postRepo, likeRepo: likeRepo, tradingURL: tradingURL}
}

func (s *PostService) Create(ctx context.Context, userID int64, title, content string, imageURLs []string, productIDs []int64) (*entity.Post, error) {
	post := &entity.Post{
		UserID:    userID,
		Title:     title,
		Content:   content,
		ImageURLs: imageURLs,
		Status:    "active",
	}
	if err := s.postRepo.Create(ctx, post); err != nil {
		return nil, err
	}
	if len(productIDs) > 0 {
		_ = s.postRepo.SaveProductLinks(ctx, post.ID, productIDs)
	}
	return post, nil
}

func (s *PostService) GetByID(ctx context.Context, id int64, viewerID int64) (*entity.Post, error) {
	post, err := s.postRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	s.enrichPost(ctx, post, viewerID)
	return post, nil
}

func (s *PostService) List(ctx context.Context, params mysql.ListPostsParams, viewerID int64) ([]*entity.Post, int64, error) {
	posts, total, err := s.postRepo.List(ctx, params)
	if err != nil {
		return nil, 0, err
	}
	s.enrichPosts(ctx, posts, viewerID)
	return posts, total, nil
}

func (s *PostService) ToggleLike(ctx context.Context, postID, userID int64) (bool, int, error) {
	liked, err := s.likeRepo.Toggle(ctx, postID, userID)
	if err != nil {
		return false, 0, err
	}
	delta := 1
	if !liked {
		delta = -1
	}
	_ = s.postRepo.IncrLike(ctx, postID, delta)

	post, err := s.postRepo.GetByIDAdmin(ctx, postID)
	if err != nil {
		return liked, 0, nil
	}
	return liked, post.LikeCount, nil
}

func (s *PostService) SoftDelete(ctx context.Context, postID, userID int64) error {
	post, err := s.postRepo.GetByIDAdmin(ctx, postID)
	if err != nil {
		return err
	}
	if post.UserID != userID {
		return fmt.Errorf("forbidden")
	}
	return s.postRepo.SoftDelete(ctx, postID)
}

func (s *PostService) AdminUpdateStatus(ctx context.Context, postID int64, status string) error {
	return s.postRepo.UpdateStatus(ctx, postID, status)
}

func (s *PostService) AdminHardDelete(ctx context.Context, postID int64) error {
	return s.postRepo.HardDelete(ctx, postID)
}

func (s *PostService) AdminList(ctx context.Context, params mysql.ListPostsParams) ([]*entity.Post, int64, error) {
	return s.postRepo.List(ctx, params)
}

// enrichPost fills virtual fields (author name, products, is_liked).
func (s *PostService) enrichPost(ctx context.Context, post *entity.Post, viewerID int64) {
	productIDs, _ := s.postRepo.GetProductIDs(ctx, post.ID)
	if len(productIDs) > 0 {
		post.Products = s.fetchProducts(productIDs)
	}
	if viewerID > 0 {
		post.IsLiked = s.likeRepo.IsLiked(ctx, post.ID, viewerID)
	}
}

func (s *PostService) enrichPosts(ctx context.Context, posts []*entity.Post, viewerID int64) {
	if len(posts) == 0 {
		return
	}
	ids := make([]int64, len(posts))
	for i, p := range posts {
		ids[i] = p.ID
	}
	if viewerID > 0 {
		liked := s.likeRepo.IsLikedBatch(ctx, ids, viewerID)
		for _, p := range posts {
			p.IsLiked = liked[p.ID]
		}
	}
}

// fetchProducts calls trading-service internal endpoint.
func (s *PostService) fetchProducts(ids []int64) []entity.PostProductInfo {
	if len(ids) == 0 {
		return nil
	}
	parts := make([]string, len(ids))
	for i, id := range ids {
		parts[i] = strconv.FormatInt(id, 10)
	}
	url := fmt.Sprintf("%s/internal/products?ids=%s", s.tradingURL, strings.Join(parts, ","))

	resp, err := http.Get(url) //nolint:gosec
	if err != nil {
		return nil
	}
	defer resp.Body.Close()

	var result struct {
		Data []entity.PostProductInfo `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil
	}
	return result.Data
}
