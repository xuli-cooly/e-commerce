## 1. 数据库准备

- [x] 1.1 docker-compose.yml MySQL 服务中新增 `auth` 数据库初始化（`MYSQL_INITDB` 或 init SQL 脚本）
- [x] 1.2 编写数据迁移 SQL：`INSERT INTO auth.users SELECT * FROM trading.users`
- [x] 1.3 在本地执行数据迁移，验证 `auth.users` 数据完整

## 2. auth-service：切换至独立数据库

- [x] 2.1 `services/auth/config/config.yaml`：DSN 改为 `auth` 库（`/trading` → `/auth`）
- [x] 2.2 重启 auth-service，确认 AutoMigrate 在 `auth` 库正常建表
- [x] 2.3 验证登录流程（send-code → login）在新库下正常工作

## 3. auth-service：新增内部用户查询接口

- [x] 3.1 新增 `GET /internal/users` handler，接受 `ids` query 参数（逗号分隔），返回用户列表
- [x] 3.2 新增对应 Repository 方法 `FindByIDs(ctx, ids []int64) ([]*entity.User, error)`
- [x] 3.3 在 `cmd/server/main.go` 注册 `/internal/users` 路由（不经过 JWT 中间件）
- [x] 3.4 验证：`curl "http://localhost:8001/internal/users?ids=1,2"` 返回正确数据
- [x] 3.5 验证：ids 为空时返回 1001 参数错误

## 4. trading-service：移除 User 实体和 userRepo

- [x] 4.1 `services/trading/internal/model/entity/entity.go`：删除 User struct
- [x] 4.2 `services/trading/internal/repository/mysql/database.go`：AutoMigrate 列表中移除 `&entity.User{}`
- [x] 4.3 `services/trading/internal/repository/mysql/repo.go`：删除 userRepo struct 及全部方法（`FindByPhone`、`Upsert`、`FindByID`、`FindByEmail`、`UpdatePassword`）
- [x] 4.4 Order、Favorite、Review entity 中的 `User` 关联字段（`gorm:"foreignKey:UserID"`）和 `User User` 字段删除，保留 `UserID int64`
- [x] 4.5 `services/trading/cmd/seed/main.go`：移除 user 写入逻辑（admin / user1 创建部分）

## 5. trading-service：实现 auth-service 客户端

- [x] 5.1 新建 `services/trading/internal/pkg/authclient/client.go`，实现 `GetUsers(ctx, ids []int64) (map[int64]*UserInfo, error)`，调用 `http://localhost:8001/internal/users`
- [x] 5.2 auth-service 地址通过环境变量 `AUTH_SERVICE_URL` 配置，默认值 `http://localhost:8001`
- [x] 5.3 调用超时设置 500ms，失败时返回空 map（不向上传播错误）

## 6. trading-service：handler 层聚合用户信息

- [x] 6.1 订单列表 handler（`ListAll` / `ListByUserID`）：查询完订单后，收集所有 `UserID`，调用 authclient 批量获取，填充响应 DTO 中的 `user` 字段
- [x] 6.2 评价列表 handler（`ListByProduct`）：同上，填充 review 的 `user` 字段
- [x] 6.3 删除所有 `Preload("User")` 调用（repo.go 中 order、review 相关查询）
- [x] 6.4 确认编译通过，所有引用 `entity.User` 的地方已清理

## 7. 验证

- [x] 7.1 `./start.sh --skip-docker` 启动所有服务，无编译报错
- [x] 7.2 管理员登录正常（auth-service 从 `auth` 库查用户）
- [x] 7.3 管理后台订单列表正常展示，user.phone 有值
- [x] 7.4 评价列表正常展示 user 信息
- [x] 7.5 trading-service 的 `trading` 库中确认无 users 表（或 users 表不再被 AutoMigrate 更新）
