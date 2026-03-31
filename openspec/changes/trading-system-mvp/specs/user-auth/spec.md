## ADDED Requirements

### Requirement: 用户端手机号 Mock 登录
系统 SHALL 允许用户通过手机号 + 固定验证码 `123456` 完成登录，登录成功后颁发 JWT，有效期 7 天。系统 SHALL 按手机号 upsert 用户记录（首次登录自动注册）。

#### Scenario: 正确验证码登录成功
- **WHEN** 用户输入任意合法手机号（11位数字）且验证码为 `123456`
- **THEN** 系统返回 HTTP 200，响应体包含 `token`（JWT）和用户基本信息

#### Scenario: 验证码错误登录失败
- **WHEN** 用户输入手机号和非 `123456` 的验证码
- **THEN** 系统返回 HTTP 401，错误信息为"验证码错误"

#### Scenario: 手机号格式非法
- **WHEN** 用户输入不是 11 位数字的手机号
- **THEN** 系统返回 HTTP 400，错误信息为"手机号格式不正确"

#### Scenario: 登录后访问受保护接口
- **WHEN** 请求头携带有效 JWT（`Authorization: Bearer <token>`）
- **THEN** 系统正常处理请求，返回对应资源

#### Scenario: 未登录访问受保护接口
- **WHEN** 请求头不携带 JWT 或 JWT 已过期
- **THEN** 系统返回 HTTP 401

---

### Requirement: 管理员固定账号登录
系统 SHALL 支持管理员使用固定账号 `admin` / 密码 `admin123` 登录管理后台，登录成功后颁发携带 `role: ADMIN` 的 JWT。

#### Scenario: 管理员正确账密登录
- **WHEN** 输入账号 `admin`，密码 `admin123`
- **THEN** 返回 HTTP 200，响应体包含 `token`，token 中 role 为 ADMIN

#### Scenario: 管理员账密错误
- **WHEN** 输入错误的账号或密码
- **THEN** 返回 HTTP 401，错误信息为"账号或密码错误"

#### Scenario: 普通用户 token 访问管理接口
- **WHEN** 使用 role 为 USER 的 token 访问 `/api/v1/admin/*` 路径
- **THEN** 返回 HTTP 403
