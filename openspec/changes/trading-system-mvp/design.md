## Context

全量新建的电商交易系统雏形，无任何历史代码依赖。技术栈要求：Go 后端、MySQL 主库、Redis 缓存、Elasticsearch 搜索、RabbitMQ 消息队列、Swagger API 文档，前端保持 React。需在单一代码仓库内交付所有组件，技术选型以快速交付为首要目标，兼顾可演示性与可扩展性。

## Goals / Non-Goals

**Goals:**
- 用户端完整购物闭环：登录 → 浏览商品 → 下单 → 查看订单
- 管理后台核心运营：登录 → 商品增删改查 → 订单查看与状态管理
- Mock 支付（无真实支付网关集成）
- Mock 登录（固定验证码，无短信服务）
- MySQL 数据持久化
- Redis 缓存：JWT token 黑名单、热点商品数据缓存
- Elasticsearch：商品全文搜索与筛选
- RabbitMQ：订单创建后异步发布事件（如通知、库存扣减）
- Swagger UI 自动生成并可访问（`/swagger/index.html`）
- 加分能力：购物车、搜索筛选（走 ES）、订单状态流转、数据统计面板

**Non-Goals:**
- 真实短信/支付网关对接
- 用户注册流程
- 多租户/多商户
- 移动端 App（仅 Web，响应式友好即可）
- 生产级别的安全加固（如防暴力破解、WAF）
- ES 集群高可用（单节点用于演示）

## Decisions

### 1. 后端技术栈：Go + Gin + GORM + Swaggo

**选择**:
- Web 框架：`gin-gonic/gin`
- ORM：`gorm.io/gorm` + `gorm.io/driver/mysql`
- Redis 客户端：`go-redis/redis/v9`
- ES 客户端：`elastic/go-elasticsearch/v8`
- RabbitMQ 客户端：`rabbitmq/amqp091-go`
- Swagger：`swaggo/swag` + `swaggo/gin-swagger` + `swaggo/files`
- JWT：`golang-jwt/jwt/v5`
- 配置管理：`spf13/viper`
- 日志：`uber-go/zap`
- 参数校验：`go-playground/validator/v10`（gin 内置集成）

**理由**: Gin 是 Go 生态最成熟的 Web 框架，性能优秀；GORM 对 MySQL 支持完整；swaggo 可通过注释自动生成 Swagger 文档，无需手写 YAML。

**备选**: Echo（差异不大）；Ent ORM（学习曲线较高）；手写 OpenAPI（维护成本高）。

---

### 2. 仓库结构：Monorepo

```
/backend
  /cmd
    /server          # main.go 启动入口（组装依赖、启动服务）
    /seed            # 数据初始化脚本
  /internal
    /handler         # HTTP 处理器（含 swaggo 注释）
    /service         # 业务逻辑层
    /repository      # 数据访问层
      /mysql         # GORM 实现
      /redis         # go-redis 实现
      /es            # ES 实现
    /model
      /entity        # GORM 数据库实体
      /dto           # 请求/响应 DTO
    /middleware      # 全局与路由级中间件
    /mq              # RabbitMQ publisher / consumer
    /pkg
      /response      # 统一响应封装
      /errors        # AppError + 业务错误码
      /jwt           # token 生成与解析
      /logger        # zap 初始化与封装
  /docs              # swag generate 输出（不手动编辑）
  /config
    /config.yaml     # 配置文件模板
/apps
  /client            # 用户端 React 应用（Vite）
  /admin             # 管理后台 React 应用（Vite）
```

---

### 3. 认证方案：JWT + Redis 黑名单

**选择**: 登录颁发 JWT（有效期 7 天），Redis 存储已登出 token 黑名单（TTL 与 token 剩余有效期一致）。

**Mock 规则**:
- 用户端：任意手机号 + 验证码 `123456` → upsert user → 颁发 JWT
- 管理后台：固定 `admin` / `admin123` → 颁发携带 `role:ADMIN` 的 JWT

---

### 4. MySQL Schema 核心表

| 表名 | 关键字段 |
|------|---------|
| users | id(bigint PK), phone(varchar 20 unique), role(ENUM USER/ADMIN), created_at, updated_at |
| products | id(bigint PK), name(varchar 200), description(text), image_url(varchar 500), price(decimal 10,2), stock(int), is_active(tinyint), created_at, updated_at |
| orders | id(bigint PK), user_id(bigint FK), status(ENUM PENDING/PAID/SHIPPED/REFUNDED), total_amount(decimal 10,2), created_at, updated_at |
| order_items | id(bigint PK), order_id(bigint FK), product_id(bigint FK), quantity(int), unit_price(decimal 10,2) |
| carts | id(bigint PK), user_id(bigint FK unique) |
| cart_items | id(bigint PK), cart_id(bigint FK), product_id(bigint FK), quantity(int) |

---

### 5. Redis 使用策略

| Key 模式 | 用途 | TTL |
|---------|------|-----|
| `token:blacklist:<jti>` | 登出 token 黑名单 | token 剩余有效期 |
| `product:detail:<id>` | 商品详情缓存 | 10 分钟 |
| `product:list:<hash>` | 商品列表缓存（按参数 hash） | 5 分钟 |
| `stats:dashboard` | 统计面板缓存 | 1 分钟 |

商品数据变更（新增/编辑）时主动删除对应缓存 key（Cache-Aside 模式）。

---

### 6. Elasticsearch 商品索引

**索引名**: `products`

**字段**:
- `id` (keyword)
- `name` (text, analyzer: ik_max_word 或 standard)
- `description` (text)
- `price` (float)
- `is_active` (boolean)

**同步策略**: 商品新增/编辑时，后端写 MySQL 后同步写 ES（先写 DB，再写 ES；ES 写失败仅记录日志，不影响主流程）。商品列表搜索优先走 ES，ES 不可用时降级走 MySQL LIKE 查询。

---

### 7. RabbitMQ 消息设计

| Exchange | Routing Key | Queue | 消费者行为 |
|---------|-------------|-------|-----------|
| `order.events` (direct) | `order.created` | `order.created.queue` | 记录日志/打印通知（演示用） |
| `order.events` (direct) | `order.paid` | `order.paid.queue` | 模拟库存扣减确认（演示用）|

订单创建/支付成功后，handler 异步 publish 消息；consumer 作为 goroutine 随服务启动。

---

### 8. API 设计：RESTful `/api/v1`，全量 Swagger 注释

```
POST   /api/v1/auth/login
POST   /api/v1/auth/admin/login
GET    /api/v1/products
GET    /api/v1/products/:id
GET    /api/v1/cart
POST   /api/v1/cart/items
DELETE /api/v1/cart/items/:id
POST   /api/v1/orders
POST   /api/v1/orders/:id/pay
GET    /api/v1/orders

GET    /api/v1/admin/products
POST   /api/v1/admin/products
PUT    /api/v1/admin/products/:id
GET    /api/v1/admin/orders
PUT    /api/v1/admin/orders/:id/status
GET    /api/v1/admin/stats

GET    /swagger/index.html           # Swagger UI
```

---

### 9. 前端技术栈

React + Vite + TypeScript + react-router-dom + **Ant Design (antd)**，用户端与管理后台分目录独立启动。

**UI 组件库**: Ant Design (`antd`) — 组件覆盖全面，Table/Form/Modal 等管理后台常用组件开箱即用，减少自定义 UI 工作量。主题色 `#01c2c3`，通过 Ant Design ConfigProvider 的 `token.colorPrimary` 全局覆盖默认蓝色。

**状态管理**: Zustand — 轻量、无样板代码，适合中小规模应用。全局状态（用户 token/信息、购物车数量角标）用 Zustand store 管理，服务端数据（商品列表、订单列表）直接用组件级 `useState` + axios 请求，不过度全局化。

**管理后台多 Tab 导航**: 管理后台实现类浏览器标签页的历史访问切换能力，设计要点如下：

- **范围**: 仅管理后台（`apps/admin`），用户端不需要
- **Tab 数据结构**: `{ key: string(path), title: string, path: string, fixed?: boolean }`
- **状态存储**: 独立的 `useTabStore`（Zustand），通过 `persist` 中间件存入 `sessionStorage`，浏览器刷新后恢复
- **页面保活**: 切换 tab 时不卸载组件，使用 `display: none / block` CSS 控制显隐，保留表格分页、表单填写等页面状态
- **数量上限**: 最多同时开启 10 个 tab；"数据统计"为固定 tab（不可关闭）；超出上限时自动关闭最早打开的非固定 tab
- **关闭行为**: 关闭当前激活 tab → 激活左侧 tab；关闭最后一个可关闭 tab → 回到固定首页 tab
- **路由联动时序**:
  ```
  侧边栏点击 / URL 变化
        │
        ▼
  tabStore.openTab(path, title)
  ├── 已存在 → 仅激活
  └── 不存在 → push 并激活
        │
        ▼
  Ant Design <Tabs> 渲染，<Outlet> 保活切换
  ```

---

### 10. 后端整体架构规范

#### 10.1 分层架构与请求生命周期

```
HTTP Request
    │
    ▼
┌─────────────────────────────────────────────┐
│           Global Middleware                 │
│  CORS → RequestID → Logger → Recovery       │
└─────────────────────────┬───────────────────┘
                          │
    ┌─────────────────────▼───────────────────┐
    │         Route-level Middleware          │
    │     [AuthMiddleware] [AdminMiddleware]  │
    └─────────────────────┬───────────────────┘
                          │
    ┌─────────────────────▼───────────────────┐
    │               Handler 层               │
    │  参数绑定 → 校验 → 调用 Service → 响应  │
    └─────────────────────┬───────────────────┘
                          │
    ┌─────────────────────▼───────────────────┐
    │               Service 层               │
    │   业务规则 → 编排 Repository → MQ Pub   │
    └──────┬──────────────┬──────────┬────────┘
           ▼              ▼          ▼
      ┌─────────┐   ┌──────────┐  ┌──────┐
      │  MySQL  │   │  Redis   │  │  ES  │
      │  Repo   │   │  Cache   │  │Search│
      └─────────┘   └──────────┘  └──────┘
                                    ▼
                              ┌──────────┐
                              │ RabbitMQ │
                              │Publisher │
                              └──────────┘
```

中间件执行顺序固定为：`CORS → RequestID → Logger → Recovery → [Auth] → [Admin]`

理由：
- CORS 最先，保证 preflight 请求不被后续中间件拦截
- RequestID 在 Logger 之前注入，日志才能携带请求 ID
- Recovery 在业务中间件之前，确保 Auth/Admin panic 也能被捕获
- Auth/Admin 路由级按需挂载，不污染公开接口

---

#### 10.2 统一响应体规范

所有接口统一返回以下结构，前端只需处理一种格式：

**成功（单对象）**
```json
{
  "code":    1000,
  "message": "success",
  "data":    { }
}
```

**成功（列表 + 分页）**
```json
{
  "code":    1000,
  "message": "success",
  "data": {
    "list":  [],
    "total": 100,
    "page":  1,
    "size":  20
  }
}
```

**错误**
```json
{
  "code":    1201,
  "message": "商品库存不足",
  "data":    null
}
```

规则：
- HTTP status 与业务码**双轨**：HTTP status 给网关/监控/浏览器用，业务码给前端逻辑判断用
- 错误响应体**永远不暴露**堆栈信息、SQL 语句、内部错误原文
- `data` 字段在错误时统一为 `null`，不省略该字段（保持结构一致）
- 分页参数 `page` 从 1 开始，`size` 默认 20，最大 100

`response` 包提供三个函数，Handler 只允许调用这三个，不允许直接调用 `c.JSON`：
```
response.Success(c, data)
response.SuccessList(c, list, total, page, size)
response.Fail(c, appErr)
```

---

#### 10.3 错误码体系

按模块分段，出错时一眼定位来源：

```
┌─────────┬──────────────┬──────────────────────────────┐
│  段     │  范围        │  归属                         │
├─────────┼──────────────┼──────────────────────────────┤
│  成功   │  1000        │  统一成功码                   │
│  通用   │  1001~1099   │  参数、认证、权限、通用        │
│  用户   │  1100~1199   │  登录、账号相关                │
│  商品   │  1200~1299   │  商品不存在、库存等            │
│  订单   │  1300~1399   │  下单、支付、状态流转          │
│  购物车 │  1400~1499   │  加购、删除等                 │
│  管理   │  1500~1599   │  后台操作相关                 │
│  系统   │  5000~5099   │  DB/Redis/ES/MQ 异常          │
└─────────┴──────────────┴──────────────────────────────┘
```

完整错误码定义：

```
1000  成功

// 通用
1001  参数校验失败
1002  未登录 / token 无效或已过期
1003  权限不足
1004  资源不存在

// 用户模块
1100  验证码错误
1101  手机号格式错误
1102  账号或密码错误
1103  用户不存在

// 商品模块
1200  商品不存在或已下架
1201  商品库存不足
1202  商品必填字段缺失

// 订单模块
1300  订单不存在
1301  无权操作此订单
1302  订单状态不合法（不在允许范围内）
1303  订单已支付，不可重复支付
1304  购物车为空，无法结算

// 购物车模块
1400  购物车商品不存在
1401  无权操作此购物车条目

// 系统
5000  服务内部错误
5001  数据库异常
5002  缓存服务异常
5003  搜索服务异常
5004  消息队列异常
```

`AppError` 结构：
- `Code int` — 业务码
- `Message string` — 面向前端的提示文案（中文）
- `HTTPStatus int` — 对应的 HTTP 状态码
- `Err error` — 原始错误，仅内部日志使用，**不进响应体**

Service 层通过 `.WithErr(err)` 附加内部错误用于日志，Handler 只感知 AppError，不处理底层错误细节。

---

#### 10.4 参数校验规范

使用 `go-playground/validator/v10`（gin 内置），规则写在 DTO struct tag 上：

```go
type CreateOrderReq struct {
    Items    []OrderItemReq `json:"items"    binding:"required,min=1,dive"`
    FromCart bool           `json:"from_cart"`
}

type OrderItemReq struct {
    ProductID int64 `json:"product_id" binding:"required,min=1"`
    Quantity  int   `json:"quantity"   binding:"required,min=1,max=999"`
}
```

校验失败统一返回 `ErrInvalidParams`（1001），不将 validator 原始错误文本透传给前端，避免信息泄露。

分页参数统一规范：
```
page  int  默认 1，最小 1
size  int  默认 20，最小 1，最大 100
```

路径参数 ID 在 Handler 层做 `strconv.ParseInt` 转换，转换失败返回 `ErrInvalidParams`。

---

#### 10.5 Middleware 详细规范

**CORS 中间件**
- 允许来源：开发环境 `*`，生产环境配置白名单
- 允许 Methods：`GET, POST, PUT, DELETE, OPTIONS`
- 允许 Headers：`Content-Type, Authorization, X-Request-ID`
- 暴露 Headers：`X-Request-ID`
- Preflight 缓存：`max-age=86400`

**RequestID 中间件**
- 优先读请求头 `X-Request-ID`，有则复用（链路透传）
- 无则生成 UUID v4
- 写入 `gin.Context`（key: `"requestId"`）
- 写入响应头 `X-Request-ID`
- 贯穿整个请求：日志、错误响应、下游调用均携带

**Logger 中间件（两阶段）**

请求进入：
```
INFO  → POST /api/v1/orders
        requestId=abc-123  ip=1.2.3.4  ua=Mozilla/5.0...
```

请求结束：
```
INFO  ← POST /api/v1/orders
        requestId=abc-123  status=201  latency=12ms  userID=42
```

日志级别规则：
- `status < 400` → INFO
- `400 <= status < 500` → WARN
- `status >= 500` → ERROR

**Recovery 中间件**
- 捕获所有 panic
- 记录 ERROR 日志，包含：requestId、panic 内容、完整 stack trace
- 返回 `Fail(c, ErrInternal)`
- 响应体绝不包含 stack trace

**AuthMiddleware 完整流程**
```
取 Authorization header
        │
        ▼
  格式校验：必须为 "Bearer <token>"
  不合法 → Fail(ErrUnauthorized)
        │
        ▼
  jwt.ParseToken(tokenStr)
  解析失败 / 签名错误 / 已过期 → Fail(ErrUnauthorized)
        │
        ▼
  查 Redis: EXISTS token:blacklist:<jti>
  存在（已登出）→ Fail(ErrUnauthorized)
        │
        ▼
  注入 gin.Context:
    "userID" = claims.UserID  (int64)
    "role"   = claims.Role    (string)
    "jti"    = claims.ID      (string)
        │
        ▼
       Next()
```

**AdminMiddleware**
```
读 ctx["role"]
  != "ADMIN" → Fail(ErrForbidden) + Abort
  == "ADMIN" → Next()
```

路由分组挂载：
```
公开路由组        无中间件
用户路由组        AuthMiddleware
管理员路由组      AuthMiddleware + AdminMiddleware
```

---

#### 10.6 Repository 层规范

每个 repository 定义 interface，Service 依赖接口而非具体实现，便于单元测试 mock：

```
internal/repository/
  ├── interface.go      所有 interface 集中定义
  ├── mysql/            GORM 实现
  ├── redis/            go-redis 实现
  └── es/               ES 客户端实现
```

Interface 设计原则：
- 所有方法第一参数为 `context.Context`
- 返回值统一为 `(result, error)`，不在 repository 层处理 AppError（那是 Service 层的职责）
- 方法命名：`FindByID` / `List` / `Create` / `Update` / `Delete`，不用 `Get`（避免歧义）

核心 interface 定义：

```go
type ProductRepo interface {
    FindByID(ctx context.Context, id int64) (*entity.Product, error)
    List(ctx context.Context, req *dto.ProductListReq) ([]*entity.Product, int64, error)
    Create(ctx context.Context, p *entity.Product) error
    Update(ctx context.Context, p *entity.Product) error
    DecrStock(ctx context.Context, id int64, qty int) error  // 原子扣库存
}

type OrderRepo interface {
    FindByID(ctx context.Context, id int64) (*entity.Order, error)
    ListByUserID(ctx context.Context, userID int64, page, size int) ([]*entity.Order, int64, error)
    ListAll(ctx context.Context, page, size int) ([]*entity.Order, int64, error)
    CreateWithItems(ctx context.Context, order *entity.Order, items []*entity.OrderItem) error  // 事务
    UpdateStatus(ctx context.Context, id int64, status string) error
}

type CacheRepo interface {
    Get(ctx context.Context, key string) (string, error)
    Set(ctx context.Context, key string, val any, ttl time.Duration) error
    Del(ctx context.Context, keys ...string) error
    Exists(ctx context.Context, key string) (bool, error)
    SetNX(ctx context.Context, key string, val any, ttl time.Duration) (bool, error)
}

type SearchRepo interface {
    IndexProduct(ctx context.Context, p *entity.Product) error
    BulkIndex(ctx context.Context, products []*entity.Product) error
    Search(ctx context.Context, keyword string, page, size int) ([]*entity.Product, int64, error)
    DeleteProduct(ctx context.Context, id int64) error
}
```

---

#### 10.7 Service 层规范

**依赖注入原则**：
- Service 通过构造函数注入依赖（repository interface + MQ publisher），不使用全局变量
- Service 之间**不互相调用**：OrderService 需要商品数据直接调用 `productRepo`，而非调用 `ProductService`，避免循环依赖
- `main.go` 统一手动组装（不引入 wire 等框架，保持简单透明）

**事务规范**：
- 涉及多表写操作（如创建订单同时写 order + order_items + 扣库存）必须使用 GORM 事务
- 事务由 Service 层控制，不下沉到 Repository 层（Repository 接受外部传入的 `*gorm.DB` 或通过 WithTx 方法）
- 事务失败必须回滚，回滚失败记录 ERROR 日志

**MQ 发布规范**：
- Publish 调用为异步非阻塞（goroutine + channel 或直接 go func）
- Publish 失败**只记录 ERROR 日志**，不影响主流程响应
- 消息体为 JSON，包含足够的上下文信息（不依赖消费者再查库）：
  ```json
  {
    "event":      "order.created",
    "occurredAt": "2026-03-12T10:00:00Z",
    "payload": {
      "orderID":     123,
      "userID":      42,
      "totalAmount": 299.00,
      "items": [...]
    }
  }
  ```

---

#### 10.8 日志规范

使用 `uber-go/zap`，结构化日志，JSON 格式输出。

**必须打日志的场景**：

| 场景 | 级别 | 必含字段 |
|------|------|---------|
| 请求开始/结束 | INFO | requestId, method, path, status, latency, userID |
| 业务错误（4xx） | WARN | requestId, code, message |
| 系统错误（5xx） | ERROR | requestId, error, stack |
| panic 捕获 | ERROR | requestId, panic, stack |
| MQ publish 失败 | ERROR | requestId, event, error |
| ES 写入失败 | WARN | productID, error |
| Redis 操作失败 | WARN | key, op, error |
| 服务启动/关闭 | INFO | port, env |
| DB 慢查询（>200ms） | WARN | sql, latency |

**字段命名规范**（全小写驼峰，统一英文）：
```
requestId    string   请求唯一 ID
userID       int64    操作用户 ID
method       string   HTTP method
path         string   请求路径
status       int      HTTP 状态码
latency      string   耗时，如 "12ms"
error        string   错误信息
stack        string   堆栈（仅 ERROR 级别）
```

**禁止事项**：
- 不打印密码、token 原文、手机号完整值（手机号打印前三后四，中间 `****`）
- 不在日志里打印完整 SQL（防 SQL 注入信息泄露，仅打印耗时）
- 不使用 `fmt.Println` 替代日志

---

#### 10.9 分页规范

**请求参数**（Query String）：
```
page   int  页码，默认 1，最小 1
size   int  每页条数，默认 20，最小 1，最大 100
```

超出范围时自动修正为边界值，不返回错误（降低前端接入成本）。

**响应结构**（统一嵌套在 `data` 内）：
```json
{
  "list":  [],
  "total": 100,
  "page":  1,
  "size":  20
}
```

`total` 为满足条件的总条数（非当前页条数），前端用于计算总页数。

---

#### 10.10 Context 贯穿规范

所有 Repository / Service 方法**第一参数必须是 `context.Context`**，Handler 传入 `c.Request.Context()`。

目的：
- 客户端断开时，DB/Redis/ES 查询自动取消，释放连接资源
- requestId 通过 ctx 传递到所有下游调用，实现完整链路追踪
- 为后续接入 OpenTelemetry 等链路追踪系统预留接口

从 gin.Context 中取值的辅助函数统一封装在 `middleware` 包：
```go
func GetUserID(c *gin.Context) int64
func GetRole(c *gin.Context) string
func GetRequestID(c *gin.Context) string
```

---

#### 10.11 MQ Consumer 容错规范

Consumer goroutine 在服务启动时随 main 一起启动，容错设计：

```
启动 consumer goroutine
        │
        ▼
  连接 RabbitMQ，声明 exchange + queue
        │
        ▼
  开始消费消息循环
        │
   ┌────▼────┐
   │ 收到消息 │
   └────┬────┘
        │
        ▼
  业务处理（panic-safe，defer recover）
        │
   ┌────▼─────────────────┐
   │ 处理成功 → Ack        │
   │ 业务失败 → Nack       │  ← 重新入队（最多重试 3 次）
   │ panic   → Ack + 记 ERROR 日志  │  ← 避免死循环
   └──────────────────────┘
        │
   连接断开时：指数退避重连（1s, 2s, 4s, 最大 30s）
```

消费失败超过 3 次的消息，Nack 且不重新入队（演示阶段），记录 ERROR 日志供人工排查。

---

#### 10.12 ES 降级规范

ES 对商品搜索提供增强能力，但不是核心依赖：

```
商品搜索请求
        │
        ▼
  尝试调用 ES SearchRepo
        │
   ┌────▼──────────────────┐
   │ ES 正常 → 返回结果      │
   │ ES 超时/连接失败        │
   │   → 记录 WARN 日志     │
   │   → 降级走 MySQL LIKE  │
   └───────────────────────┘
```

ES 超时阈值：500ms（通过 context.WithTimeout 控制）。

---

### 11. Swagger 规范

- 所有接口**必须**有完整 swaggo 注释，包含：`@Summary`、`@Tags`、`@Accept`、`@Produce`、`@Param`（每个参数）、`@Success`、`@Failure`、`@Router`
- 需要认证的接口标注 `@Security ApiKeyAuth`
- 统一使用 `@Tags` 按模块分组：`Auth`、`Product`、`Order`、`Cart`、`Admin`
- 响应示例使用真实 DTO struct，不写 `object` 泛型
- 每次修改 handler 后重新执行 `swag init` 更新 docs

## Risks / Trade-offs

- **ES 写失败不阻断主流程** → 商品编辑后 ES 可能短暂不一致，降级走 MySQL 保证可用性；演示场景可接受
- **RabbitMQ consumer 故障** → 指数退避重连 + recover 兜底，消费失败超 3 次记日志不重试；生产环境需死信队列
- **Redis 缓存击穿** → 演示场景流量极低，忽略；生产环境用 SetNX 加互斥锁
- **MySQL 库存并发超卖** → 原子 `UPDATE WHERE stock >= qty`，无需分布式锁；高并发下仍需压测验证
- **JWT 存 localStorage 有 XSS 风险** → 演示场景可接受，生产环境改用 HttpOnly Cookie
- **图片存储** → 商品图片使用外部 URL，不做文件上传
- **中间件依赖启动顺序** → MySQL → Redis → RabbitMQ → ES → Go server → 前端；docker-compose 通过 `depends_on` + healthcheck 保证顺序
