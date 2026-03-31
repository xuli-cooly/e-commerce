## Context

当前 auth-service 和 trading-service 共用 MySQL `trading` 数据库。trading-service 持有独立的 `User` 实体定义，并通过 GORM `foreignKey` 和 `Preload("User")` 直接跨服务边界做 DB join。auth-service 负责签发 JWT，trading-service 也持有完整的用户读写能力，形成双重所有权。

现有问题：
- 两个服务的 AutoMigrate 都会对 users 表做 DDL，存在 schema 竞争
- trading-service seed 绕过 auth-service 直接往 users 表写数据
- 任一服务的 DB 变更需要协调部署

## Goals / Non-Goals

**Goals:**
- auth-service 拥有独立的 `auth` 数据库，完全负责 users 表的生命周期
- trading-service 移除对 users 表的直接读写，user_id 作为不透明外键存储
- 订单列表、评价列表等需要展示用户信息的接口，通过调用 auth-service HTTP API 聚合
- 对外接口响应结构不变（字段名、类型保持兼容）

**Non-Goals:**
- 引入服务注册/发现（auth-service 地址通过环境变量配置即可）
- 用户数据的事件驱动同步或本地缓存
- 跨服务分布式事务

## Decisions

### 1. 用户数据获取策略：同步 HTTP 调用，不做本地缓存

**选择**：trading-service 在需要展示用户信息时，调用 auth-service 的内部接口 `GET /internal/users?ids=1,2,3` 批量获取。

**理由**：管理后台的订单列表、评价列表是低频操作，延迟可接受。批量接口一次 RTT 获取多个用户，性能影响可控。引入本地缓存会带来一致性问题，超出本次变更范围。

**备选**：在 orders 表冗余存储 user_phone 字段（快照模式）。优点是零额外 RTT；缺点是用户修改信息后历史订单展示不一致，且 review 场景无法同样处理。

### 2. 内部接口位置：auth-service 新增 `/internal/` 路由组

**选择**：auth-service 新增 `GET /internal/users` 路由，不经过 Gateway JWT 验签（Gateway 不转发 `/internal/` 路径），仅服务间直接调用。

**理由**：保持 Gateway 的职责单一（对外暴露），服务间通信走内网直连，不绕路 Gateway。

**备选**：复用现有 `/api/v1/` 路由加 admin token。增加了 token 管理复杂度，不选。

### 3. trading-service 中 User 关联字段处理：拆为轻量 DTO

**选择**：Order、Review 的响应 DTO 中保留 `user` 字段（结构为 `{ id, phone, role }`），但不再是 GORM 关联，而是 handler 层在查询 DB 后，收集 user_id 列表，调用 auth-service 批量获取后手动填充。

**理由**：对前端零感知，不破坏现有接口契约。

### 4. 数据库初始化：docker-compose 新增 `auth` 库

**选择**：在 docker-compose 的 MySQL 服务中通过 `MYSQL_INITDB` 脚本初始化 `auth` 数据库，auth-service AutoMigrate 负责建表。

## Risks / Trade-offs

- **auth-service 不可用时影响 trading 写操作** → trading-service 对 auth API 调用失败时，订单列表的 user 字段返回空对象而非报错，不阻断核心交易流程
- **首次拆分需要数据迁移** → users 表数据需从 `trading` 库复制到 `auth` 库，迁移脚本需在停机窗口执行或做双写过渡

## Migration Plan

1. 在 MySQL 中创建 `auth` 数据库
2. 将 `trading.users` 数据迁移到 `auth.users`（一次性 INSERT SELECT）
3. 更新 auth-service config DSN 指向 `auth` 库，重启 auth-service 验证登录正常
4. 更新 trading-service：移除 User entity、userRepo，实现 auth client，重启验证订单列表正常
5. 确认无误后，可选择从 `trading` 库删除 users 表（谨慎操作，建议保留一段时间）

**回滚**：trading-service 代码回滚，auth-service DSN 改回 `trading` 库。
