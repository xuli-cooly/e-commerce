package repository

import (
	"context"

	"auth-service/internal/model/entity"
)

type UserRepo interface {
	FindByPhone(ctx context.Context, phone string) (*entity.User, error)
	Upsert(ctx context.Context, phone, role string) (*entity.User, error)
	FindByID(ctx context.Context, id int64) (*entity.User, error)
	FindByEmail(ctx context.Context, email string) (*entity.User, error)
	UpdatePassword(ctx context.Context, userID int64, hashedPwd string) error
	FindByIDs(ctx context.Context, ids []int64) ([]*entity.User, error)
}
