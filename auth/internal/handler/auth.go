package handler

import (
	"time"

	"auth-service/internal/model/dto"
	apperrors "auth-service/internal/pkg/errors"
	"auth-service/internal/pkg/response"
	redisdb "auth-service/internal/repository/redis"
	"auth-service/internal/service"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authSvc service.AuthService
}

func NewAuthHandler(authSvc service.AuthService) *AuthHandler {
	return &AuthHandler{authSvc: authSvc}
}

// SendCode godoc
// @Summary      发送短信验证码
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Param        body body dto.SendCodeReq true "手机号"
// @Success      200  {object}  response.body{data=dto.SendCodeResp}
// @Failure      400  {object}  response.body
// @Failure      429  {object}  response.body
// @Router       /auth/send-code [post]
func (h *AuthHandler) SendCode(c *gin.Context) {
	var req dto.SendCodeReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail(c, apperrors.ErrInvalidParams)
		return
	}
	resp, err := h.authSvc.SendCode(c.Request.Context(), &req)
	if err != nil {
		failErr(c, err)
		return
	}
	response.Success(c, resp)
}

// Login godoc
// @Summary      用户登录
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Param        body body dto.LoginReq true "手机号+验证码"
// @Success      200  {object}  response.body{data=dto.LoginResp}
// @Failure      400  {object}  response.body
// @Failure      401  {object}  response.body
// @Router       /auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail(c, apperrors.ErrInvalidParams)
		return
	}
	resp, err := h.authSvc.Login(c.Request.Context(), &req)
	if err != nil {
		failErr(c, err)
		return
	}
	response.Success(c, resp)
}

// AdminLogin godoc
// @Summary      管理员登录
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Param        body body dto.AdminLoginReq true "账号+密码"
// @Success      200  {object}  response.body{data=dto.LoginResp}
// @Failure      401  {object}  response.body
// @Router       /auth/admin/login [post]
func (h *AuthHandler) AdminLogin(c *gin.Context) {
	var req dto.AdminLoginReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail(c, apperrors.ErrInvalidParams)
		return
	}
	resp, err := h.authSvc.AdminLogin(c.Request.Context(), &req)
	if err != nil {
		failErr(c, err)
		return
	}
	response.Success(c, resp)
}

// Logout godoc
// @Summary      登出（加入黑名单）
// @Tags         Auth
// @Security     ApiKeyAuth
// @Produce      json
// @Success      200  {object}  response.body
// @Router       /auth/logout [post]
func (h *AuthHandler) Logout(c *gin.Context) {
	jti := c.GetString("jti")
	if jti == "" {
		response.Success(c, nil)
		return
	}
	ttl := 7 * 24 * time.Hour
	_ = redisdb.Client.Set(c.Request.Context(), "token:blacklist:"+jti, 1, ttl)
	response.Success(c, nil)
}

// SetPassword godoc
// @Summary      设置/修改密码
// @Tags         Auth
// @Security     ApiKeyAuth
// @Accept       json
// @Produce      json
// @Param        body body dto.SetPasswordReq true "新密码"
// @Success      200  {object}  response.body
// @Router       /auth/set-password [post]
func (h *AuthHandler) SetPassword(c *gin.Context) {
	var req dto.SetPasswordReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail(c, apperrors.ErrInvalidParams)
		return
	}
	userID := getContextUserID(c)
	if err := h.authSvc.SetPassword(c.Request.Context(), userID, &req); err != nil {
		failErr(c, err)
		return
	}
	response.Success(c, nil)
}

// PasswordLogin godoc
// @Summary      密码登录
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Param        body body dto.PasswordLoginReq true "邮箱+密码"
// @Success      200  {object}  response.body{data=dto.LoginResp}
// @Failure      400  {object}  response.body
// @Failure      401  {object}  response.body
// @Router       /auth/password-login [post]
func (h *AuthHandler) PasswordLogin(c *gin.Context) {
	var req dto.PasswordLoginReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail(c, apperrors.ErrInvalidParams)
		return
	}
	resp, err := h.authSvc.PasswordLogin(c.Request.Context(), &req)
	if err != nil {
		failErr(c, err)
		return
	}
	response.Success(c, resp)
}
