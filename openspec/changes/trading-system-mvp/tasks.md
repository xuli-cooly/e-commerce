## 1. 项目初始化与基础设施

- [x] 1.1 初始化仓库目录结构：`/backend`（Go 服务）+ `/apps/client`（用户端）+ `/apps/admin`（管理后台）
- [x] 1.2 初始化 Go module：`go mod init`，添加依赖：gin、gorm/mysql、go-redis、go-elasticsearch、amqp091-go、jwt/v5、viper、zap、swaggo/swag
- [x] 1.3 编写 `backend/config/config.yaml`（MySQL DSN、Redis addr、ES addr、RabbitMQ URL、JWT secret、port 等），用 viper 加载
- [x] 1.4 编写 docker-compose.yml：MySQL 8、Redis 7、Elasticsearch 8（单节点）、RabbitMQ 3（含 management 插件）四个服务
- [x] 1.5 验证 docker-compose up 后四个中间件均正常启动并可连接

## 2. 数据库 Schema 与初始数据（MySQL）

- [x] 2.1 使用 GORM AutoMigrate 定义并同步六张表：users、products、orders、order_items、carts、cart_items
- [x] 2.2 编写 seed 脚本（`cmd/seed/main.go`）：插入 admin 用户 + 至少 5 件商品
- [x] 2.3 运行 seed，验证 MySQL 数据正常

## 3. Go 后端基础框架

- [x] 3.1 编写 `cmd/server/main.go`：初始化配置、DB、Redis、ES、RabbitMQ 连接，启动 Gin 路由，注册 Swagger 路由
- [x] 3.2 封装 MySQL 连接（GORM）、Redis 连接（go-redis）、ES 客户端（go-elasticsearch）、RabbitMQ 连接（amqp091-go）为全局单例
- [x] 3.3 配置 zap 日志：区分 DEBUG/INFO/ERROR 级别，输出到 stdout
- [x] 3.4 实现 Gin 中间件：CORS、请求日志（zap）、recover（panic 恢复）、统一错误响应格式 `{code, message, data}`
- [x] 3.5 实现 JWT 工具：`GenerateToken(userID, role)`、`ParseToken(tokenStr)` → claims，`jti` 使用 UUID
- [x] 3.6 实现 `AuthMiddleware`：解析 Bearer token，检查 Redis 黑名单，注入 `userID`/`role` 到 gin.Context
- [x] 3.7 实现 `AdminMiddleware`：检查 role == ADMIN，否则返回 403

## 4. Swagger 配置

- [x] 4.1 在 `main.go` 和各 handler 文件顶部补充 swaggo 注释（`@title`、`@version`、`@host`、`@securityDefinitions.apikey`）
- [x] 4.2 运行 `swag init -g cmd/server/main.go -o docs/` 生成 `docs/` 文件
- [x] 4.3 在路由中注册 `GET /swagger/*any` → `ginSwagger.WrapHandler(swaggerFiles.Handler)`
- [x] 4.4 验证访问 `http://localhost:8080/swagger/index.html` 可正常看到 Swagger UI

## 5. RabbitMQ 消息队列

- [x] 5.1 封装 RabbitMQ publisher：声明 `order.events` direct exchange，提供 `Publish(routingKey, body)` 方法
- [x] 5.2 实现 `order.created.queue` consumer goroutine：消费消息后打印日志（演示用）
- [x] 5.3 实现 `order.paid.queue` consumer goroutine：消费消息后打印"库存扣减确认"日志（演示用）
- [x] 5.4 在服务启动时（main.go）启动两个 consumer goroutine，consumer panic 时 recover 并重连

## 6. 认证接口（user-auth spec）

- [x] 6.1 实现 handler `POST /api/v1/auth/login`：校验手机号（11位数字）+ 验证码 `123456`，upsert user，颁发 JWT；添加完整 swaggo 注释
- [x] 6.2 实现 handler `POST /api/v1/auth/admin/login`：校验 admin/admin123，颁发 ADMIN role JWT；添加 swaggo 注释
- [x] 6.3 实现 handler `POST /api/v1/auth/logout`（可选）：将 jti 写入 Redis 黑名单，TTL = token 剩余有效期

## 7. 商品 ES 索引同步

- [x] 7.1 初始化 ES：服务启动时检查 `products` 索引是否存在，不存在则创建（mapping 含 id/name/description/price/is_active）
- [x] 7.2 封装 ES repository：`IndexProduct(product)`、`SearchProducts(keyword, filters) []ProductHit`、`DeleteProduct(id)`
- [x] 7.3 seed 脚本写入 MySQL 后，同步将商品数据批量写入 ES

## 8. 商品相关接口（product-catalog spec）

- [x] 8.1 实现 handler `GET /api/v1/products`：有 `?search=` 时走 ES 搜索，无则走 ES match_all；ES 不可用降级走 MySQL LIKE；结果缓存到 Redis 5 分钟；添加 swaggo 注释
- [x] 8.2 实现 handler `GET /api/v1/products/:id`：先查 Redis 缓存，缓存 miss 则查 MySQL 并写缓存（TTL 10 分钟）；添加 swaggo 注释
- [x] 8.3 实现 handler `GET /api/v1/admin/products`（AdminMiddleware）：直接查 MySQL 全量；添加 swaggo 注释
- [x] 8.4 实现 handler `POST /api/v1/admin/products`（AdminMiddleware）：写 MySQL → 同步写 ES → 删除列表缓存；校验必填字段；添加 swaggo 注释
- [x] 8.5 实现 handler `PUT /api/v1/admin/products/:id`（AdminMiddleware）：更新 MySQL → 同步更新 ES → 删除详情缓存 + 列表缓存；添加 swaggo 注释

## 9. 订单相关接口（order-management spec）

- [x] 9.1 实现 handler `POST /api/v1/orders`（AuthMiddleware）：校验商品存在 + 库存（原子 UPDATE 防超卖），创建 order + order_items（MySQL 事务），成功后 publish `order.created` 消息到 RabbitMQ；支持 `from_cart` 参数；添加 swaggo 注释
- [x] 9.2 实现 handler `POST /api/v1/orders/:id/pay`（AuthMiddleware）：校验订单归属 + 状态为 PENDING，更新状态为 PAID，publish `order.paid` 消息；添加 swaggo 注释
- [x] 9.3 实现 handler `GET /api/v1/orders`（AuthMiddleware）：查询当前用户订单列表，倒序；添加 swaggo 注释
- [x] 9.4 实现 handler `GET /api/v1/admin/orders`（AdminMiddleware）：查询全平台订单含用户手机号（JOIN users）；添加 swaggo 注释
- [x] 9.5 实现 handler `PUT /api/v1/admin/orders/:id/status`（AdminMiddleware）：校验合法状态值后更新；删除统计缓存；添加 swaggo 注释

## 10. 购物车接口（shopping-cart spec）

- [x] 10.1 实现 handler `GET /api/v1/cart`（AuthMiddleware）：查购物车 + 关联商品，计算小计；添加 swaggo 注释
- [x] 10.2 实现 handler `POST /api/v1/cart/items`（AuthMiddleware）：upsert cart_item（已存在则累加数量），校验商品 is_active；添加 swaggo 注释
- [x] 10.3 实现 handler `DELETE /api/v1/cart/items/:id`（AuthMiddleware）：校验 cart_item 归属后删除；添加 swaggo 注释

## 11. 统计接口（dashboard-stats spec）

- [x] 11.1 实现 handler `GET /api/v1/admin/stats`（AdminMiddleware）：先查 Redis 缓存（TTL 1 分钟），缓存 miss 则聚合 MySQL 查询（total_revenue/total_orders/paid_orders/total_products），写入缓存后返回；添加 swaggo 注释

## 12. 用户端前端（apps/client）

- [x] 12.1 初始化 React + Vite + TypeScript，配置 react-router-dom，封装 axios instance（base URL、Authorization header）
- [x] 12.2 实现登录页：手机号 + 验证码输入，调用 `/api/v1/auth/login`，token 存 localStorage
- [x] 12.3 实现路由守卫（PrivateRoute）：无 token 重定向登录页
- [x] 12.4 实现商品列表页：顶部搜索框（?search=），商品卡片网格（图片/名称/价格）
- [x] 12.5 实现商品详情页：图片、名称、价格、描述、"加入购物车"、"立即购买"按钮
- [x] 12.6 实现购物车页：商品列表、删除按钮、合计金额、"去结算"按钮
- [x] 12.7 实现下单与支付：结算调用 `POST /orders`，支付调用 `POST /orders/:id/pay`，成功显示"支付成功"Toast
- [x] 12.8 实现订单列表页：历史订单表格（订单号/金额/状态/时间）

## 13. 管理后台前端（apps/admin）

- [x] 13.1 初始化 React + Vite + TypeScript，配置路由，实现管理员登录页
- [x] 13.2 实现路由守卫：无 ADMIN token 重定向登录页，显示"权限不足"提示
- [x] 13.3 实现侧边栏导航：商品管理、订单管理、数据统计
- [x] 13.4 实现 `useTabStore`（Zustand + sessionStorage persist）：openTab / closeTab / setActive，上限 10 个，固定 tab 不可关闭
- [x] 13.5 实现 `AdminLayout` 多 Tab 组件：Ant Design `<Tabs>` 渲染 tab 栏，页面内容区用 `display:none/block` 保活切换，与 react-router 路由双向联动
- [x] 13.6 实现商品管理页：表格（全部商品含下架）+ "新增"按钮 + 每行"编辑"按钮
- [x] 13.7 实现新增/编辑商品弹窗表单：名称、描述、图片URL、价格、库存、是否上架
- [x] 13.8 实现订单管理页：全平台订单表格（用户手机号/金额/状态），下拉修改状态
- [x] 13.9 实现数据统计面板：4 张卡片（总销售额/总订单数/已支付订单数/商品总数），作为固定 tab

## 14. 集成验证与收尾

- [x] 14.1 验证 Swagger UI 所有接口注释完整，可在 UI 上发起调试请求
- [x] 14.2 端到端测试：用户注册→浏览商品（ES 搜索）→加购→下单→支付→订单列表
- [x] 14.3 端到端测试：管理员登录→新增商品（验证 ES/缓存同步）→查看订单→改状态→查看统计
- [x] 14.4 验证 RabbitMQ Management UI 中消息流转正常（order.created / order.paid 队列有消费记录）
- [x] 14.5 验证 Redis 缓存命中：商品详情第二次请求走缓存（通过日志或 Redis Monitor 确认）
- [x] 14.6 编写 README：docker-compose 启动步骤、seed 命令、各服务端口、Swagger 访问地址
- [x] 14.7 补充 `.env.example` / `config.yaml.example`：所有可配置项说明
