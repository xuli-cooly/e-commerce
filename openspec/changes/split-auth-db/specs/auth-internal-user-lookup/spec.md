## ADDED Requirements

### Requirement: auth-service 提供内部用户批量查询接口
auth-service SHALL 提供 `GET /internal/users?ids=<id1>,<id2>,...` 接口，返回指定 ID 列表的用户基本信息（id、phone、role），供 trading-service 等内部服务调用。该接口不经过 Gateway，不需要 JWT 验证。

#### Scenario: 批量查询已存在的用户
- **WHEN** trading-service 以 `ids=1,2,3` 调用 `GET /internal/users`
- **THEN** 返回 `{ code: 1000, data: [{ id, phone, role }, ...] }`，仅包含实际存在的用户，顺序不保证

#### Scenario: ids 中部分 ID 不存在
- **WHEN** 请求的 ids 中有不存在的用户 ID
- **THEN** 返回结果中不包含该 ID，不报错

#### Scenario: ids 参数为空或缺失
- **WHEN** 请求不携带 ids 参数或 ids 为空字符串
- **THEN** 返回 `{ code: 1001, message: "参数错误" }`

### Requirement: trading-service 订单列表聚合用户信息
trading-service 的管理后台订单列表 `GET /api/v1/admin/orders` SHALL 通过调用 auth-service 内部接口填充每条订单的用户信息，响应结构与现有保持一致（包含 `user.phone` 字段）。

#### Scenario: auth-service 正常时订单列表包含用户信息
- **WHEN** 调用 `GET /api/v1/admin/orders` 且 auth-service 可达
- **THEN** 每条订单的 `user` 字段包含 `{ id, phone, role }`

#### Scenario: auth-service 不可达时订单列表仍正常返回
- **WHEN** 调用 `GET /api/v1/admin/orders` 且 auth-service 超时或报错
- **THEN** 订单列表正常返回，每条订单的 `user` 字段为 `null`，HTTP 状态码为 200

### Requirement: auth-service 使用独立数据库
auth-service SHALL 连接独立的 `auth` 数据库，不再使用 `trading` 数据库。users 表由 auth-service AutoMigrate 管理。

#### Scenario: auth-service 启动时自动建表
- **WHEN** `auth` 数据库为空时 auth-service 启动
- **THEN** users 表被自动创建，服务正常启动

#### Scenario: auth-service 登录功能正常
- **WHEN** 用户使用邮箱 + 验证码登录
- **THEN** auth-service 从 `auth` 库查询/创建用户，签发 JWT，流程与之前一致

### Requirement: trading-service 不再直接读写 users 表
trading-service SHALL 不持有 User 实体，不对 users 表做任何直接 SQL 操作（包括 AutoMigrate、查询、写入）。

#### Scenario: trading-service 启动不操作 users 表
- **WHEN** trading-service 启动并执行 AutoMigrate
- **THEN** users 表不在 AutoMigrate 列表中，`trading` 库中不存在 users 表也不报错
