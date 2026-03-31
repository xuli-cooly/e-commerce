package mysql

import (
	"context"

	"community-service/internal/model/entity"

	"gorm.io/gorm"
)

type PostLikeRepo struct{ db *gorm.DB }

func NewPostLikeRepo(db *gorm.DB) *PostLikeRepo { return &PostLikeRepo{db: db} }

// Toggle adds a like if not exists, removes if exists. Returns new liked state.
func (r *PostLikeRepo) Toggle(ctx context.Context, postID, userID int64) (bool, error) {
	var existing entity.PostLike
	err := r.db.WithContext(ctx).
		Where("post_id = ? AND user_id = ?", postID, userID).
		First(&existing).Error

	if err == gorm.ErrRecordNotFound {
		// Not liked — create.
		if err2 := r.db.WithContext(ctx).Create(&entity.PostLike{PostID: postID, UserID: userID}).Error; err2 != nil {
			return false, err2
		}
		return true, nil
	}
	if err != nil {
		return false, err
	}
	// Already liked — remove.
	if err2 := r.db.WithContext(ctx).Delete(&existing).Error; err2 != nil {
		return false, err2
	}
	return false, nil
}

// IsLiked returns true if the user has liked the post.
func (r *PostLikeRepo) IsLiked(ctx context.Context, postID, userID int64) bool {
	var count int64
	r.db.WithContext(ctx).Model(&entity.PostLike{}).
		Where("post_id = ? AND user_id = ?", postID, userID).
		Count(&count)
	return count > 0
}

// IsLikedBatch returns a map[postID]bool for multiple posts.
func (r *PostLikeRepo) IsLikedBatch(ctx context.Context, postIDs []int64, userID int64) map[int64]bool {
	result := make(map[int64]bool)
	if len(postIDs) == 0 {
		return result
	}
	var rows []entity.PostLike
	r.db.WithContext(ctx).
		Where("post_id IN ? AND user_id = ?", postIDs, userID).
		Find(&rows)
	for _, row := range rows {
		result[row.PostID] = true
	}
	return result
}
