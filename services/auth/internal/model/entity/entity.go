package entity

import (
	"time"
)

type User struct {
	ID        int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	Phone     string    `gorm:"type:varchar(20);uniqueIndex;not null" json:"phone"`
	Role      string    `gorm:"type:enum('USER','ADMIN');default:'USER';not null" json:"role"`
	Password  *string   `gorm:"type:varchar(255)" json:"-"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
