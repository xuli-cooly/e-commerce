package mysqlrepo

import (
	"context"

	"auth-service/internal/model/entity"

	"gorm.io/gorm"
	)

type userRepo struct{ db *gorm.DB }

func NewUserRepo(db *gorm.DB) *userRepo { return &userRepo{db} }

func (r *userRepo) FindByPhone(ctx context.Context, phone string) (*entity.User, error) {
	var u entity.User
	err := r.db.WithContext(ctx).Where("phone = ?", phone).First(&u).Error
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *userRepo) Upsert(ctx context.Context, phone, role string) (*entity.User, error) {
	u := &entity.User{Phone: phone, Role: role}
	err := r.db.WithContext(ctx).
		Where(entity.User{Phone: phone}).
		Attrs(entity.User{Role: role}).
		FirstOrCreate(u).Error
	return u, err
}

func (r *userRepo) FindByID(ctx context.Context, id int64) (*entity.User, error) {
	var u entity.User
	err := r.db.WithContext(ctx).First(&u, id).Error
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *userRepo) FindByEmail(ctx context.Context, email string) (*entity.User, error) {
	var u entity.User
	err := r.db.WithContext(ctx).Where("phone = ?", email).First(&u).Error
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *userRepo) UpdatePassword(ctx context.Context, userID int64, hashedPwd string) error {
	return r.db.WithContext(ctx).Model(&entity.User{}).Where("id = ?", userID).Update("password", hashedPwd).Error
}

func (r *userRepo) FindByIDs(ctx context.Context, ids []int64) ([]*entity.User, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	var users []*entity.User
	err := r.db.WithContext(ctx).Where("id IN ?", ids).Find(&users).Error
	return users, err
}
