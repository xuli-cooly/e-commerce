# 淘好物 — 项目上下文

## 服务拓扑

```
Browser
  ├── :5173  client（用户端 React）
  └── :3000  admin-shell（Qiankun 基座）
               ├── :3001  admin-trading（商品/订单子应用）
               └── :3002  admin-community（社区管理子应用）
                        ↓ 所有 HTTP 请求
                  Gateway :8000  （JWT 验签 + 路由转发）
                ↙         ↓         ↘
         auth:8001  trading:8002  community:8003
                         ↓
               MySQL · Redis · ES · RabbitMQ
```

## 目录结构

```
/services/gateway/       Go — JWT 验签、反向代理，唯一对外入口
/services/auth/          Go — 邮箱 OTP 登录、Token 签发、黑名单
/services/trading/       Go — 商品、订单、购物车、统计
/services/community/     Go — 帖子、点赞、图片上传、管理审核
/apps/client/            React 18 用户端，Vite :5173
/apps/admin-shell/       React 18 Qiankun 基座，Vite :3000
/apps/admin-trading/     React 18 交易管理子应用，Vite :3001
/apps/admin-community/   React 18 社区管理子应用，Vite :3002
/openspec/               设计规格（proposal / design / specs / tasks）
```

## 关键约定（后端）

- **分层**：Handler → Service → Repository，层间只通过 interface 交互
- **响应体**：`{ code, message, data }`，1000 成功，1001 参数错误，按模块分段
- **Context**：所有 Repository / Service 方法第一参数为 `context.Context`
- **JWT**：由 auth-service 签发，Gateway 统一验签并注入 `X-User-Id` / `X-User-Role`
- **ES 降级**：搜索超时 500ms 自动降级到 MySQL LIKE
- **MQ**：消费失败指数退避，超 3 次记日志不重试
- **静态文件**：community-service 的 `./static/` 目录，通过 Gateway `/static/` 路由对外

## 关键约定（前端）

- **Vite proxy**：`/api` 和 `/static` 均代理到 Gateway `:8000`
- **Qiankun 状态共享**：Shell 通过 `globalState` 向子应用注入 `token` / `userInfo`
- **Tab KeepAlive**：Shell 层用 `display:none/block` 保活，路径用完整路径（`/admin/trading/stats`）
- **子应用 401 处理**：`window.history.pushState` + `dispatchEvent(new PopStateEvent('popstate'))`，不能用 `window.location.href`（会刷新 Shell）
- **图片 URL**：upload 接口返回相对路径 `/static/uploads/...`，前端直接用，Vite proxy 转发到 Gateway

## 启动方式

```bash
./start.sh                  # 全量启动（中间件 + 后端 + 前端）
./start.sh --skip-docker    # 跳过 docker-compose（中间件已在运行）
./start.sh --backend-only   # 只启动后端
```

Gateway 单独重启（改了 middleware 代码后）：
```bash
kill $(lsof -t -i:8000) 2>/dev/null
cd services/gateway && JWT_SECRET="Tr@d1ngSys#JWT\$Secret2026!xK9mP" go run cmd/server/main.go &
```

## 测试账号

| 角色 | 方式 | 凭据 |
|------|------|------|
| 管理员 | username + password | `admin` / `Admin@2026#Trading!` |
| 普通用户 | 邮箱 + OTP | 真实邮箱（163 SMTP），或直接往 Redis 写 `email:code:<addr>` |

> **注意**：密码含 `!`，bash 单引号/双引号都会触发 history expansion，调试时用 python3 发请求：
> ```bash
> python3 -c "import urllib.request,json; ..."
> ```

## 各服务配置文件位置

| 服务 | 配置 |
|------|------|
| auth | `services/auth/config/config.yaml` |
| trading | `services/trading/config/config.yaml` |
| community | 环境变量（`COMMUNITY_DB_DSN` / `COMMUNITY_PORT`） |
| gateway | 环境变量（`JWT_SECRET` / `AUTH_SERVICE_URL` 等） |

## 已知坑

- Gateway `JWT_SECRET` 默认值是 `"trading-secret-key"`，启动时必须通过环境变量覆盖，否则与 auth-service 密钥不一致导致全局 401
- `POST /api/v1/posts`、`POST /api/v1/posts/:id/like` 路径在 Gateway `skipPrefixes` 里，中间件已改为 optional auth（有 token 就注入，无 token 放行），不要改回原来的 skip-entirely 逻辑
