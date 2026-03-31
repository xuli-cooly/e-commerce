package service

import (
	"context"
	"fmt"
	"math/rand"
	"regexp"
	"time"

	"auth-service/config"
	"auth-service/internal/model/dto"
	apperrors "auth-service/internal/pkg/errors"
	"auth-service/internal/pkg/email"
	"auth-service/internal/pkg/logger"
	jwtpkg "auth-service/internal/pkg/jwt"
	"auth-service/internal/repository"
	redisdb "auth-service/internal/repository/redis"

	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

const (
	emailCodeTTL      = 5 * time.Minute
	emailCodeCooldown = 60 * time.Second
)

func emailCodeKey(addr string) string { return "email:code:" + addr }

type authService struct {
	userRepo repository.UserRepo
}

func NewAuthService(userRepo repository.UserRepo) AuthService {
	return &authService{userRepo: userRepo}
}

func (s *authService) SendCode(ctx context.Context, req *dto.SendCodeReq) (*dto.SendCodeResp, error) {
	if !emailRegex.MatchString(req.Email) {
		return nil, apperrors.ErrInvalidEmail
	}

	code := fmt.Sprintf("%06d", rand.Intn(1000000))

	if redisdb.Client != nil {
		key := emailCodeKey(req.Email)
		// 60s 防刷
		ttl, err := redisdb.Client.TTL(ctx, key).Result()
		if err == nil && ttl > emailCodeTTL-emailCodeCooldown {
			return nil, apperrors.ErrCodeNotExpired
		}
		if err := redisdb.Client.Set(ctx, key, code, emailCodeTTL).Err(); err != nil {
			return nil, apperrors.ErrInternal.WithErr(err)
		}
	}

	if err := email.SendVerifyCode(req.Email, code); err != nil {
		logger.Error("email send failed", zap.String("to", req.Email), zap.Error(err))
		return nil, apperrors.ErrEmailSendFailed
	}

	logger.Info("email code sent", zap.String("to", req.Email))
	return &dto.SendCodeResp{}, nil
}

func (s *authService) Login(ctx context.Context, req *dto.LoginReq) (*dto.LoginResp, error) {
	if !emailRegex.MatchString(req.Email) {
		return nil, apperrors.ErrInvalidEmail
	}

	if redisdb.Client != nil {
		stored, err := redisdb.Client.Get(ctx, emailCodeKey(req.Email)).Result()
		if err != nil {
			return nil, apperrors.ErrCodeExpired
		}
		if req.Code != stored {
			return nil, apperrors.ErrWrongCode
		}
		_ = redisdb.Client.Del(ctx, emailCodeKey(req.Email))
	} else {
		return nil, apperrors.ErrInternal
	}

	user, err := s.userRepo.Upsert(ctx, req.Email, "USER")
	if err != nil {
		return nil, apperrors.ErrInternal.WithErr(err)
	}
	token, err := jwtpkg.GenerateToken(user.ID, user.Role)
	if err != nil {
		return nil, apperrors.ErrInternal.WithErr(err)
	}
	return &dto.LoginResp{Token: token, UserID: user.ID, Role: user.Role, HasPassword: user.Password != nil}, nil
}

func (s *authService) AdminLogin(ctx context.Context, req *dto.AdminLoginReq) (*dto.LoginResp, error) {
	cfg := config.Global.Admin
	if req.Username != cfg.Username || req.Password != cfg.Password {
		return nil, apperrors.ErrWrongPassword
	}
	user, err := s.userRepo.Upsert(ctx, "admin", "ADMIN")
	if err != nil {
		return nil, apperrors.ErrInternal.WithErr(err)
	}
	token, err := jwtpkg.GenerateToken(user.ID, "ADMIN")
	if err != nil {
		return nil, apperrors.ErrInternal.WithErr(err)
	}
	return &dto.LoginResp{Token: token, UserID: user.ID, Role: "ADMIN"}, nil
}

func (s *authService) SetPassword(ctx context.Context, userID int64, req *dto.SetPasswordReq) error {
	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return apperrors.ErrInternal.WithErr(err)
	}
	if err := s.userRepo.UpdatePassword(ctx, userID, string(hashed)); err != nil {
		return apperrors.ErrInternal.WithErr(err)
	}
	return nil
}

func (s *authService) PasswordLogin(ctx context.Context, req *dto.PasswordLoginReq) (*dto.LoginResp, error) {
	user, err := s.userRepo.FindByEmail(ctx, req.Email)
	if err != nil {
		return nil, apperrors.ErrUserNotFound
	}
	if user.Password == nil {
		return nil, apperrors.ErrPasswordNotSet
	}
	if err := bcrypt.CompareHashAndPassword([]byte(*user.Password), []byte(req.Password)); err != nil {
		return nil, apperrors.ErrWrongPassword
	}
	token, err := jwtpkg.GenerateToken(user.ID, user.Role)
	if err != nil {
		return nil, apperrors.ErrInternal.WithErr(err)
	}
	return &dto.LoginResp{Token: token, UserID: user.ID, Role: user.Role, HasPassword: true}, nil
}
