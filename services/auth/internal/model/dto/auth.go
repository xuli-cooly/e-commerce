package dto

type SendCodeReq struct {
	Email string `json:"email" binding:"required"`
}

type SendCodeResp struct{}

type LoginReq struct {
	Email string `json:"email" binding:"required"`
	Code  string `json:"code"  binding:"required"`
}

type AdminLoginReq struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResp struct {
	Token       string `json:"token"`
	UserID      int64  `json:"userId"`
	Role        string `json:"role"`
	HasPassword bool   `json:"has_password"`
}

type SetPasswordReq struct {
	Password string `json:"password" binding:"required,min=8,max=64"`
}

type PasswordLoginReq struct {
	Email    string `json:"email"    binding:"required,email"`
	Password string `json:"password" binding:"required"`
}
