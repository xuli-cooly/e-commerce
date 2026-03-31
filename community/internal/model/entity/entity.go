package entity

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"
)

// StringSlice is a JSON-serialized []string stored as TEXT in MySQL.
type StringSlice []string

func (s StringSlice) Value() (driver.Value, error) {
	b, err := json.Marshal(s)
	return string(b), err
}

func (s *StringSlice) Scan(value any) error {
	switch v := value.(type) {
	case []byte:
		return json.Unmarshal(v, s)
	case string:
		return json.Unmarshal([]byte(v), s)
	}
	return fmt.Errorf("unsupported type: %T", value)
}

// Post is a community article that can reference products.
type Post struct {
	ID         int64       `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID     int64       `gorm:"not null;index" json:"user_id"`
	Title      string      `gorm:"type:varchar(200);not null" json:"title"`
	Content    string      `gorm:"type:text" json:"content"`
	ImageURLs  StringSlice `gorm:"type:text" json:"image_urls"`
	Status     string      `gorm:"type:enum('active','removed');default:'active';not null" json:"status"`
	LikeCount  int         `gorm:"default:0;not null" json:"like_count"`
	CreatedAt  time.Time   `json:"created_at"`
	UpdatedAt  time.Time   `json:"updated_at"`
	// Virtual fields populated by service layer (not stored in DB).
	AuthorName string      `gorm:"-" json:"author_name,omitempty"`
	IsLiked    bool        `gorm:"-" json:"is_liked,omitempty"`
	Products   []PostProductInfo `gorm:"-" json:"products,omitempty"`
}

// PostProduct is the join table between posts and products.
type PostProduct struct {
	ID        int64 `gorm:"primaryKey;autoIncrement" json:"id"`
	PostID    int64 `gorm:"not null;uniqueIndex:idx_post_product;index" json:"post_id"`
	ProductID int64 `gorm:"not null;uniqueIndex:idx_post_product;index" json:"product_id"`
}

// PostLike records a user's like on a post.
type PostLike struct {
	ID        int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	PostID    int64     `gorm:"not null;uniqueIndex:idx_post_like_user;index" json:"post_id"`
	UserID    int64     `gorm:"not null;uniqueIndex:idx_post_like_user" json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
}

// PostProductInfo holds denormalized product info fetched from trading-service.
type PostProductInfo struct {
	ID       int64   `json:"id"`
	Name     string  `json:"name"`
	Price    float64 `json:"price"`
	ImageURL string  `json:"image_url"`
}
