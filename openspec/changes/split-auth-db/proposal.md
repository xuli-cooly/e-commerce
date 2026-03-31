## Why

auth-service 和 trading-service 当前共用同一个 MySQL 数据库（`trading`），trading-service 直接持有 User 实体并对 users 表做读写，违反了微服务数据隔离原则。任意一个服务的 schema 变更都会影响另一个，无法独立部署和扩容。

## What Changes

- 为 auth-service 创建独立数据库 `auth`，users 表迁移至 `auth` 库
- 从 trading-service 移除 User 实体定义和 userRepo（`FindByPhone`、`Upsert`、`FindByID`、`UpdatePassword`）
- trading-service 中涉及用户信息展示的地方（订单列表、评价列表的 user 字段）改为调用 auth-service 内部 API 获取
- Order / Review 中的 `User` 关联字段改为非 FK 的轻量 DTO，不再通过 GORM `foreignKey` 跨库 Preload
- trading-service seed 中直接写入 users 表的逻辑移除
- docker-compose 新增 `auth` 数据库初始化，auth-service DSN 指向新库
- **BREAKING**：trading-service 的 `GET /admin/orders` 和 `GET /products/:id/reviews` 响应中 user 对象字段来源变更（数据不变，来源从 DB join 改为 API 聚合）

## Capabilities

### New Capabilities

- `auth-internal-user-lookup`：auth-service 提供内部用户查询接口，供 trading-service 按 ID 批量获取用户信息（phone / role）

### Modified Capabilities

（无 spec 级行为变更，对外接口响应结构保持不变）

## Impact

- `services/auth/config/config.yaml`：DSN 由 `trading` 库改为 `auth` 库
- `services/trading/internal/model/entity/entity.go`：移除 User struct
- `services/trading/internal/repository/mysql/repo.go`：移除 userRepo 及相关方法
- `services/trading/internal/repository/mysql/database.go`：AutoMigrate 移除 User
- `services/trading/internal/handler/`：order / review handler 中用户字段聚合方式调整
- `services/trading/cmd/seed/main.go`：移除 user 写入逻辑
- `docker-compose.yml`：新增 `auth` 数据库，auth-service 环境变量更新
