## Context

当前交易系统（Go + Gin + GORM + Elasticsearch）已有用户、商品、订单、收藏、评价等核心模块。前端分为客户端（React + Vite，移动端 H5，位于 `apps/client`）和管理后台（React + Ant Design，位于 `apps/admin`）。后端为单体 Go 应用（位于 `backend/`）。

本次改造在新增社区功能的同时，引入三项架构升级：
1. 后端拆分为微服务（auth / trading / community）+ API Gateway
2. 管理后台改造为 qiankun 微前端架构（shell + 子应用）
3. 引入本地文件上传服务（为 OSS 迁移做铺垫）

## Goals / Non-Goals

**Goals:**
- 后端微服务化：拆分为 auth-service / trading-service / community-service，前置 API Gateway 统一鉴权
- 新增图片上传接口：本地文件存储，接口返回可访问 URL，前端无感知存储后端
- 新增帖子数据模型及 CRUD 接口（发布、列表、详情、点赞、软删除）
- 帖子与商品 N:N 关联（通过中间表 `post_products`）
- 客户端新增社区 Tab 页（信息流 + 帖子发布 + 帖子详情），底部导航扩展为 4 Tab
- 客户端品牌升级（App 名称「淘好物」、Logo）
- 管理后台重构为 qiankun 微前端：admin-shell（基座）+ admin-trading（现有功能）+ admin-community（新增）
- 预置初始化种子帖子数据

**Non-Goals:**
- 实时消息推送 / WebSocket
- 帖子搜索（ES 索引扩展留作后续）
- 用户关注 / 粉丝关系
- 视频内容
- 帖子评论（当前只做点赞，评论留作 P2）
- 付费云 OSS（本期用本地存储，接口兼容后续替换）
- Kubernetes / 服务网格（本期 Docker Compose 多服务编排即可）

## Decisions

### D1：API Gateway 统一鉴权

**决策**：所有外部请求经 API Gateway，Gateway 验证 JWT 后将 `X-User-Id` / `X-User-Role` 注入请求头转发给下游服务；下游服务信任请求头，不再解析 JWT。

**理由**：Token 验证逻辑集中维护，各微服务无需引入 JWT 依赖；新增服务时只需在 Gateway 注册路由，无需重复实现鉴权。

**实现方式**：初期使用 Go 编写轻量 Gateway（Gin + httputil.ReverseProxy），后续可替换为 nginx/Kong。路由规则：
```
/api/v1/auth/*        → auth-service:8001   （不注入 Header，登录注册本身无需身份）
/api/v1/products/*    → trading-service:8002
/api/v1/orders/*      → trading-service:8002
/api/v1/cart/*        → trading-service:8002
/api/v1/categories/*  → trading-service:8002
/api/v1/favorites/*   → trading-service:8002
/api/v1/reviews/*     → trading-service:8002
/api/v1/posts/*       → community-service:8003
/api/v1/upload/*      → community-service:8003（或独立 media-service，本期并入 community）
/api/v1/admin/*       → 按路径前缀路由到对应服务
/static/*             → 静态文件目录（本地上传图片）
```

**备选**：nginx 反向代理 — 配置直观但 JWT 验证逻辑需 lua 脚本或 auth_request 模块，初期维护成本高。

---

### D2：微服务拆分边界

**决策**：拆分为三个服务，各自独立数据库（共享同一 MySQL 实例，不同 schema/database）：

```
auth-service     (port 8001) — users 表；JWT 签发/验证
trading-service  (port 8002) — products/orders/cart/categories/favorites/reviews 表
community-service(port 8003) — posts/post_products/post_likes 表 + 文件上传
```

**服务间通信**：community-service 查询商品信息时，通过内部 HTTP 调用 `trading-service:8002/internal/products?ids=1,2,3`（走内网，不经 Gateway，不需要 JWT）。

**理由**：按业务域拆分，边界清晰；共享 MySQL 实例降低运维复杂度（无需独立部署 3 套 DB）；内部接口走内网避免鉴权开销。

**备选**：单体保留 + 按包拆分 — 无法实现独立部署和扩缩容。

---

### D3：帖子图片本地存储

**决策**：新增 `POST /api/v1/upload` 接口，接收 `multipart/form-data`，文件保存至 `./static/uploads/<date>/<uuid>.<ext>`，返回相对 URL。前端存储 URL 字符串，渲染时拼接 Gateway baseURL 访问。

**理由**：前端 UX 与云存储一致（选文件 → 预览 → 提交），存储后端对前端完全透明；迁移至 OSS 时只改 community-service 上传逻辑，前端零改动。

**备选**：图片 URL 字段（用户粘贴） — UX 差，普通用户无法便捷发帖。

---

### D4：管理后台 qiankun 微前端架构

**决策**：现有 `apps/admin` 重命名/复制为 `apps/admin-trading`（改动极小，去掉顶层 Layout 相关依赖即可作为独立子应用）；新建 `apps/admin-shell` 作为基座（只含登录页、全局导航、qiankun 注册逻辑）；新建 `apps/admin-community` 作为社区管理子应用。

**子应用通信**：基座登录后通过 `qiankun.initGlobalState({ token, userId, role })` 写入全局状态；子应用通过 `qiankun.MicroAppStateActions.onGlobalStateChange` 读取，实现单点登录。

**路由规则**：
```
/admin/login         → 基座自有页面
/admin/trading/*     → qiankun 加载 admin-trading (dev: localhost:3001)
/admin/community/*   → qiankun 加载 admin-community (dev: localhost:3002)
```

**理由**：方案比「在现有 admin 内加 qiankun 逻辑」改动更集中可控；admin-trading 复用现有代码成本极低；后续新增业务线只需新建子应用注册即可。

**备选**：现有 admin 直接扩展 — 随业务增长耦合度越来越高，无法独立部署。

---

### D5：帖子-商品关联方向

**决策**：使用独立中间表 `post_products(post_id, product_id)`，双向索引。

**理由**：一篇帖子可关联多个商品（种草文），一个商品可被多篇帖子引用（相关帖子）。中间表支持双向查询且易于扩展（可后续加 `sort_order`、`is_primary` 等字段）。

**备选**：在 `posts` 表存 `product_ids JSON` — 无法高效反向查询（商品的相关帖子）。

---

### D6：帖子审核流程

**决策**：初期采用「发布即可见 + 后台人工下架」模式，`status` 字段枚举：`active`（正常）/ `removed`（下架）。

**理由**：冷启动阶段内容量少，无需自动审核；后台管理员人工巡检成本可接受。后续可接入内容安全 API 做前置审核。

---

### D7：信息流排序

**决策**：提供两种排序：`latest`（按 `created_at DESC`）和 `hot`（按 `like_count DESC, created_at DESC`）。默认 `latest`。

**理由**：冷启动阶段 `hot` 排序意义不大，但保留接口参数让前端可以切换，为后续算法推荐留口子。

## Risks / Trade-offs

- **[风险] 微服务拆分增加本地开发复杂度** → 提供 docker-compose.yml 一键启动所有服务；开发时各服务独立启动，Gateway 做统一入口
- **[风险] community-service 调 trading-service 的内部接口增加耦合** → 内部接口单独分组（`/internal/*`），不对外暴露；若后续解耦可改为事件驱动
- **[风险] 底部导航从 3 Tab 改为 4 Tab 后布局拥挤** → 各 Tab 文字缩短（"社区"两字），图标尺寸适当调小
- **[风险] 初始化种子数据与生产商品 ID 不对齐** → 种子脚本在 `AutoMigrate` 后运行，动态查询已有商品 ID 做关联，不硬编码
- **[风险] qiankun 子应用样式隔离** → 使用 qiankun 的 `sandbox: { strictStyleIsolation: true }` 选项；各子应用 CSS class 加业务前缀

## Migration Plan

### 后端迁移步骤
1. 在现有 `backend/` 基础上，按服务拆分目录结构为 `services/auth`、`services/trading`、`services/community`、`services/gateway`
2. `services/trading` 复用现有大部分代码，按模块移动即可
3. 新建 `services/community`，实现帖子/点赞/上传接口
4. 新建 `services/gateway`，实现路由转发 + JWT 验证头注入
5. 新建 `docker-compose.yml`，编排 4 个服务 + MySQL + Elasticsearch

### 前端迁移步骤
1. 复制 `apps/admin` → `apps/admin-trading`，改造为 qiankun 子应用（添加生命周期导出）
2. 新建 `apps/admin-shell`，实现登录页 + 导航 + qiankun 注册
3. 新建 `apps/admin-community`，实现社区管理页面
4. `apps/client` 更新品牌、新增社区 Tab 和相关页面

### 回滚策略
- 后端：Gateway 路由回切到原单体服务端口即可
- 前端：admin-shell 下线，直接访问 admin-trading 原端口
- 数据：`DROP TABLE posts, post_products, post_likes`，不影响现有数据
