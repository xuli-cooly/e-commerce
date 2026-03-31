# 淘好物

Go 微服务 + React 微前端电商系统。

## 技术栈

| 层 | 技术 |
|---|---|
| 用户端 | React 18 · Vite · TypeScript · Ant Design · Zustand |
| 管理后台 | Qiankun 微前端（Shell + 两个子应用） |
| API 网关 | Go · Gin（JWT 验签 + 路由转发） |
| 业务服务 | Go · Gin · GORM · JWT |
| 数据库 | MySQL 8 |
| 缓存 | Redis 7 |
| 搜索 | Elasticsearch 8 |
| 消息队列 | RabbitMQ 3 |

---

## 快速启动

```bash
./start.sh
```

可选参数：

| 参数 | 说明 |
|---|---|
| `--skip-docker` | 跳过 docker-compose（中间件已在运行时使用） |
| `--skip-seed` | 跳过社区种子数据写入 |
| `--backend-only` | 只启动后端四个服务，不启动前端 |

---

## 服务地址

| 服务 | 地址 |
|---|---|
| 用户端 | http://localhost:5173 |
| 管理后台 | http://localhost:3000 |
| API 网关 | http://localhost:8000/api/v1 |
| auth-service | http://localhost:8001 |
| trading-service | http://localhost:8002 |
| community-service | http://localhost:8003 |
| RabbitMQ 管理 | http://localhost:15672 （guest/guest） |
| Elasticsearch | http://localhost:9200 |

---

## 测试账号

| 角色 | 登录方式 | 凭据 |
|---|---|---|
| 管理员 | username + password | `admin` / `Admin@2026#Trading!` |
| 普通用户 | 邮箱 + OTP 验证码 | 真实邮箱（163 SMTP 发送） |

> 密码中含 `!`，bash 里用 curl 调试时注意 history expansion，建议改用 python3 发请求。

---

## 目录结构

```
/
├── services/
│   ├── gateway/          # API 网关（:8000）JWT 验签 + 路由转发
│   ├── auth/             # 认证服务（:8001）邮箱 OTP · Token · 黑名单
│   ├── trading/          # 交易服务（:8002）商品 · 订单 · 购物车 · 统计
│   └── community/        # 社区服务（:8003）帖子 · 点赞 · 图片上传
├── apps/
│   ├── client/           # 用户端（:5173）
│   ├── admin-shell/      # 管理后台基座（:3000）
│   ├── admin-trading/    # 交易管理子应用（:3001）
│   └── admin-community/  # 社区管理子应用（:3002）
├── openspec/             # 设计规格（proposal / design / specs / tasks）
├── docker-compose.yml
└── start.sh
```

---

## 配置文件

| 服务 | 位置 |
|---|---|
| auth | `services/auth/config/config.yaml` |
| trading | `services/trading/config/config.yaml` |
| community | 环境变量（`COMMUNITY_DB_DSN` / `COMMUNITY_PORT`） |
| gateway | 环境变量（`JWT_SECRET` / `*_SERVICE_URL`），见 `start.sh` |
