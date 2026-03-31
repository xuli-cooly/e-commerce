package apperrors

import "net/http"

// AppError is a structured business error with HTTP status and business code.
type AppError struct {
	Code       int
	Message    string
	HTTPStatus int
	Err        error // internal only, never sent to client
}

func (e *AppError) Error() string { return e.Message }

// WithErr attaches an internal error for logging without modifying the original sentinel.
func (e *AppError) WithErr(err error) *AppError {
	return &AppError{
		Code:       e.Code,
		Message:    e.Message,
		HTTPStatus: e.HTTPStatus,
		Err:        err,
	}
}

// Predefined errors — grouped by module segment.
var (
	// Generic 1001-1099
	ErrInvalidParams = &AppError{1001, "参数错误", http.StatusBadRequest, nil}
	ErrUnauthorized  = &AppError{1002, "未登录或 token 已失效", http.StatusUnauthorized, nil}
	ErrForbidden     = &AppError{1003, "权限不足", http.StatusForbidden, nil}
	ErrNotFound      = &AppError{1004, "资源不存在", http.StatusNotFound, nil}

	// User 1100-1199
	ErrWrongCode        = &AppError{1100, "验证码错误", http.StatusUnauthorized, nil}
	ErrInvalidPhone     = &AppError{1101, "手机号格式错误", http.StatusBadRequest, nil}
	ErrWrongPassword    = &AppError{1102, "账号或密码错误", http.StatusUnauthorized, nil}
	ErrUserNotFound     = &AppError{1103, "用户不存在", http.StatusNotFound, nil}
	ErrCodeNotExpired   = &AppError{1104, "验证码已发送，请60秒后再试", http.StatusTooManyRequests, nil}
	ErrCodeExpired      = &AppError{1105, "验证码已过期，请重新获取", http.StatusUnauthorized, nil}
	ErrInvalidEmail     = &AppError{1106, "邮箱格式错误", http.StatusBadRequest, nil}
	ErrEmailSendFailed  = &AppError{1107, "验证码发送失败，请稍后重试", http.StatusInternalServerError, nil}
	ErrPasswordNotSet   = &AppError{1108, "该账号未设置密码，请使用验证码登录", http.StatusBadRequest, nil}
	ErrPasswordTooShort = &AppError{1109, "密码长度不能少于8位", http.StatusBadRequest, nil}

	// Product 1200-1299
	ErrProductNotFound  = &AppError{1200, "商品不存在或已下架", http.StatusNotFound, nil}
	ErrStockInsufficient = &AppError{1201, "商品库存不足", http.StatusBadRequest, nil}
	ErrProductMissingFields = &AppError{1202, "商品必填字段缺失", http.StatusBadRequest, nil}

	// Order 1300-1399
	ErrOrderNotFound     = &AppError{1300, "订单不存在", http.StatusNotFound, nil}
	ErrOrderForbidden    = &AppError{1301, "无权操作此订单", http.StatusForbidden, nil}
	ErrOrderStatusInvalid = &AppError{1302, "订单状态不合法", http.StatusBadRequest, nil}
	ErrAlreadyPaid       = &AppError{1303, "订单已支付，不可重复支付", http.StatusBadRequest, nil}
	ErrCartEmpty         = &AppError{1304, "购物车为空，无法结算", http.StatusBadRequest, nil}

	// Cart 1400-1499
	ErrCartItemNotFound  = &AppError{1400, "购物车商品不存在", http.StatusNotFound, nil}
	ErrCartItemForbidden = &AppError{1401, "无权操作此购物车条目", http.StatusForbidden, nil}

	// System 5000-5099
	ErrInternal  = &AppError{5000, "服务内部错误", http.StatusInternalServerError, nil}
	ErrDBError    = &AppError{5001, "数据库异常", http.StatusInternalServerError, nil}
	ErrCacheError = &AppError{5002, "缓存服务异常", http.StatusInternalServerError, nil}
	ErrESError    = &AppError{5003, "搜索服务异常", http.StatusInternalServerError, nil}
	ErrMQError    = &AppError{5004, "消息队列异常", http.StatusInternalServerError, nil}
)
