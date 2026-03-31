package mysql

import (
	"context"

	"community-service/internal/model/entity"

	"gorm.io/gorm"
)

type PostRepo struct{ db *gorm.DB }

func NewPostRepo(db *gorm.DB) *PostRepo { return &PostRepo{db: db} }

func (r *PostRepo) Create(ctx context.Context, post *entity.Post) error {
	return r.db.WithContext(ctx).Create(post).Error
}

func (r *PostRepo) GetByID(ctx context.Context, id int64) (*entity.Post, error) {
	var p entity.Post
	err := r.db.WithContext(ctx).Where("id = ? AND status = 'active'", id).First(&p).Error
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *PostRepo) GetByIDAdmin(ctx context.Context, id int64) (*entity.Post, error) {
	var p entity.Post
	err := r.db.WithContext(ctx).First(&p, id).Error
	if err != nil {
		return nil, err
	}
	return &p, nil
}

type ListPostsParams struct {
	Sort      string // "latest" | "hot"
	ProductID *int64
	Status    string // "" = active only, "removed" = removed only, "all" = both
	Page      int
	Size      int
}

func (r *PostRepo) List(ctx context.Context, p ListPostsParams) ([]*entity.Post, int64, error) {
	q := r.db.WithContext(ctx).Model(&entity.Post{})

	if p.ProductID != nil {
		q = q.Joins("JOIN post_products ON post_products.post_id = posts.id AND post_products.product_id = ?", *p.ProductID)
	}

	switch p.Status {
	case "all":
		// no filter
	case "removed":
		q = q.Where("posts.status = 'removed'")
	default:
		q = q.Where("posts.status = 'active'")
	}

	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	switch p.Sort {
	case "hot":
		q = q.Order("posts.like_count DESC, posts.created_at DESC")
	default:
		q = q.Order("posts.created_at DESC")
	}

	offset := (p.Page - 1) * p.Size
	var posts []*entity.Post
	err := q.Offset(offset).Limit(p.Size).Find(&posts).Error
	return posts, total, err
}

func (r *PostRepo) UpdateStatus(ctx context.Context, id int64, status string) error {
	return r.db.WithContext(ctx).Model(&entity.Post{}).Where("id = ?", id).
		Update("status", status).Error
}

func (r *PostRepo) SoftDelete(ctx context.Context, id int64) error {
	return r.UpdateStatus(ctx, id, "removed")
}

func (r *PostRepo) HardDelete(ctx context.Context, id int64) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("post_id = ?", id).Delete(&entity.PostProduct{}).Error; err != nil {
			return err
		}
		if err := tx.Where("post_id = ?", id).Delete(&entity.PostLike{}).Error; err != nil {
			return err
		}
		return tx.Delete(&entity.Post{}, id).Error
	})
}

// GetProductIDs returns the product IDs associated with a post.
func (r *PostRepo) GetProductIDs(ctx context.Context, postID int64) ([]int64, error) {
	var rows []entity.PostProduct
	err := r.db.WithContext(ctx).Where("post_id = ?", postID).Find(&rows).Error
	if err != nil {
		return nil, err
	}
	ids := make([]int64, len(rows))
	for i, row := range rows {
		ids[i] = row.ProductID
	}
	return ids, nil
}

// SaveProductLinks replaces all product associations for a post.
func (r *PostRepo) SaveProductLinks(ctx context.Context, postID int64, productIDs []int64) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		tx.Where("post_id = ?", postID).Delete(&entity.PostProduct{})
		if len(productIDs) == 0 {
			return nil
		}
		rows := make([]entity.PostProduct, len(productIDs))
		for i, pid := range productIDs {
			rows[i] = entity.PostProduct{PostID: postID, ProductID: pid}
		}
		return tx.Create(&rows).Error
	})
}

// IncrLike adds delta (+1 or -1) to like_count atomically.
func (r *PostRepo) IncrLike(ctx context.Context, postID int64, delta int) error {
	return r.db.WithContext(ctx).Model(&entity.Post{}).Where("id = ?", postID).
		UpdateColumn("like_count", gorm.Expr("like_count + ?", delta)).Error
}
