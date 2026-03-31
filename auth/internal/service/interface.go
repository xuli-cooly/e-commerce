package service

import (
	"context"

	"auth-service/internal/model/dto"
)

type AuthService interface {
	SendCode(ctx context.Context, req *dto.SendCodeReq) (*dto.SendCodeResp, error)
	Login(ctx context.Context, req *dto.LoginReq) (*dto.LoginResp, error)
	AdminLogin(ctx context.Context, req *dto.AdminLoginReq) (*dto.LoginResp, error)
	SetPassword(ctx context.Context, userID int64, req *dto.SetPasswordReq) error
	PasswordLogin(ctx context.Context, req *dto.PasswordLoginReq) (*dto.LoginResp, error)
}
