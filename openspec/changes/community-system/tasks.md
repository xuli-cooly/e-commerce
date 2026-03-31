## 1. 后端目录重构

- [x] 1.1 在项目根目录新建 `services/` 目录，创建 `services/auth`、`services/trading`、`services/community`、`services/gateway` 四个子模块（各自含 `go.mod` 或共享 workspace）
- [x] 1.2 将现有 `backend/internal/` 中的 auth 相关代码迁移至 `services/auth`
- [x] 1.3 将现有 `backend/internal/` 中的商品/订单/购物车/收藏/评价/分类代码迁移至 `services/trading`
- [x] 1.4 验证 `services/trading` 独立启动后接口与迁移前一致

## 2. API Gateway 服务

- [x] 2.1 在 `services/gateway` 实现 Gin 反向代理：`httputil.ReverseProxy` + 路由规则配置
- [x] 2.2 实现 JWT 验证中间件：解析 Token → 注入 `X-User-Id` / `X-User-Role` 请求头；`/api/v1/auth/*` 跳过验证
- [x] 2.3 实现静态文件路由：`/static/*` 指向本地 uploads 目录
- [x] 2.4 编写 Gateway 配置文件（上游服务地址可通过环境变量覆盖）

## 3. Community Service 后端

- [x] 3.1 在 `services/community/internal/model/entity/` 新增 `Post`、`PostProduct`、`PostLike` struct（含 GORM tags）
- [x] 3.2 实现 `AutoMigrate` 注册三张新表
- [x] 3.3 实现 `post_repo.go`：`Create`、`GetByID`、`List`（分页+排序+product_id 筛选）、`SoftDelete`、`HardDelete`、`UpdateStatus`
- [x] 3.4 实现 `post_like_repo.go`：`Toggle`（insert or delete）、`IsLiked`
- [x] 3.5 实现 `service/post.go`：帖子业务逻辑，`GetByID` 时调 trading-service 内部接口补全商品信息
- [x] 3.6 实现 `handler/post.go`（公开接口）：
  - `POST /api/v1/posts`
  - `GET /api/v1/posts`（支持 `sort` / `page` / `size` / `product_id`）
  - `GET /api/v1/posts/:id`
  - `POST /api/v1/posts/:id/like`
  - `DELETE /api/v1/posts/:id`
- [x] 3.7 实现 `handler/admin_post.go`（管理接口）：
  - `GET /api/v1/admin/posts`（支持 status 筛选）
  - `PATCH /api/v1/admin/posts/:id`
  - `DELETE /api/v1/admin/posts/:id`（硬删除）
- [x] 3.8 实现 `handler/upload.go`：`POST /api/v1/upload`，multipart 接收、uuid 命名、保存至 `./static/uploads/<date>/`，返回相对 URL

## 4. Trading Service 内部接口

- [x] 4.1 在 `services/trading` 新增内部接口 `GET /internal/products`（query: `ids=1,2,3`），返回商品 id/name/price/image_url，仅限内网调用（不经 Gateway）

## 5. Docker Compose 编排

- [x] 5.1 在项目根目录创建 `docker-compose.yml`，编排：gateway(:8000) / auth-service(:8001) / trading-service(:8002) / community-service(:8003) / mysql / elasticsearch
- [x] 5.2 各服务 `Dockerfile`（多阶段构建）
- [x] 5.3 环境变量统一在 `.env` 文件管理（DB_DSN / JWT_SECRET / 上游服务地址等）

## 6. 种子数据

- [x] 6.1 在 `services/community/cmd/seed/` 创建社区种子脚本：查询 trading-service 已有商品 ID，插入 6-8 条示例帖子（含图片 URL 和商品关联），幂等执行

## 7. 管理后台 — admin-shell 基座

- [x] 7.1 在 `apps/` 下新建 `admin-shell`（Vite + React + Ant Design），只含：登录页、全局 Layout（侧边栏导航）、qiankun 注册逻辑
- [x] 7.2 实现登录后 `qiankun.initGlobalState({ token, userId, role })`
- [x] 7.3 注册两个子应用：admin-trading (dev: localhost:3001) 和 admin-community (dev: localhost:3002)
- [x] 7.4 侧边栏导航项：商品管理 / 订单管理 / 用户管理 / 分类管理 → 跳转 `/admin/trading/*`；社区管理 → 跳转 `/admin/community/*`

## 8. 管理后台 — admin-trading 子应用

- [x] 8.1 复制现有 `apps/admin` 为 `apps/admin-trading`
- [x] 8.2 改造为 qiankun 子应用：在入口文件导出 `bootstrap` / `mount` / `unmount` 生命周期；添加 `__POWERED_BY_QIANKUN__` 判断
- [x] 8.3 移除原有登录页和顶层 Layout（由 admin-shell 基座提供）
- [x] 8.4 通过 `qiankun.MicroAppStateActions.onGlobalStateChange` 接收 token，注入 axios 请求头
- [x] 8.5 配置 Vite `base` 和 CORS headers 适配 qiankun 加载

## 9. 管理后台 — admin-community 子应用

- [x] 9.1 新建 `apps/admin-community`（Vite + React + Ant Design），配置为 qiankun 子应用结构
- [x] 9.2 实现帖子列表页（`/admin/community/posts`）：表格含标题、作者、状态、点赞数、创建时间；状态筛选下拉
- [x] 9.3 实现下架/恢复操作（带 Popconfirm 确认）、强制删除（带二次确认 Modal）
- [x] 9.4 通过 qiankun GlobalState 接收 token，注入 axios 请求头

## 10. 客户端品牌升级

- [x] 10.1 修改 `apps/client/index.html` 将 `<title>` 改为「淘好物」
- [x] 10.2 修改 `apps/client/src/pages/LoginPage.tsx` 登录页 Logo 区域：替换为淘好物 SVG Logo（渐变购物袋）和品牌名「淘好物 APP」

## 11. 客户端底部导航更新

- [x] 11.1 修改 `apps/client/src/components/BottomNav.tsx`，扩展为 4 Tab：首页 | 社区 | 购物车 | 我的；社区使用 `CompassOutlined` 图标，路由 `/community`

## 12. 客户端社区页面

- [x] 12.1 创建 `apps/client/src/pages/CommunityPage.tsx`：最新/热门 Tab 切换；帖子卡片（封面图、标题、作者昵称、点赞数、关联商品数）；无限滚动；骨架屏；空状态
- [x] 12.2 创建 `apps/client/src/pages/PostDetailPage.tsx`：多图展示（横向滚动）；作者信息；正文；关联商品横向卡片；点赞按钮（动画 + 未登录提示）
- [x] 12.3 创建 `apps/client/src/pages/CreatePostPage.tsx`（需登录）：标题输入；多图上传（调 `/api/v1/upload`，即时预览）；正文 textarea；关联商品搜索选择；发布按钮
- [x] 12.4 在路由配置新增 `/community`、`/posts/:id`、`/posts/create`

## 13. 商品详情页关联帖子入口

- [x] 13.1 修改 `apps/client/src/pages/ProductDetailPage.tsx`：在评价区上方新增「相关种草」区块，调 `GET /api/v1/posts?product_id=<id>&size=3`；展示帖子封面缩略图和数量；点击跳转社区页（带 product_id 筛选）
