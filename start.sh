#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────
#  淘好物 — 一键启动脚本（微服务架构）
#
#  用法: ./start.sh [选项]
#    --skip-docker   跳过 docker-compose（中间件已在运行）
#    --skip-seed     跳过社区种子数据写入
#    --backend-only  只启动后端四个服务，不启动前端
# ─────────────────────────────────────────

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[ OK ]${NC}  $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERR ]${NC}  $*"; exit 1; }

SKIP_DOCKER=false
SKIP_SEED=false
BACKEND_ONLY=false

for arg in "$@"; do
  case $arg in
    --skip-docker)  SKIP_DOCKER=true ;;
    --skip-seed)    SKIP_SEED=true ;;
    --backend-only) BACKEND_ONLY=true ;;
    --help|-h)
      echo "用法: $0 [--skip-docker] [--skip-seed] [--backend-only]"
      exit 0 ;;
  esac
done

# ── 检查必要工具 ──────────────────────────
for cmd in docker go node pnpm; do
  command -v "$cmd" &>/dev/null || error "未找到 $cmd，请先安装"
done

# ── 进程管理 ──────────────────────────────
PIDS=()
cleanup() {
  echo ""
  warn "正在停止所有服务..."
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
  success "已全部停止"
  exit 0
}
trap cleanup INT TERM

LOG_DIR="$ROOT/.logs"
mkdir -p "$LOG_DIR"

# ─────────────────────────────────────────
#  Step 1: 中间件（docker-compose）
# ─────────────────────────────────────────
if [ "$SKIP_DOCKER" = false ]; then
  info "Step 1 · 启动中间件（MySQL / Redis / ES / RabbitMQ）..."
  cd "$ROOT"
  docker compose up -d mysql redis elasticsearch rabbitmq

  info "  等待 MySQL 就绪..."
  for i in $(seq 1 40); do
    if docker compose exec -T mysql mysqladmin ping -h localhost -uroot -pTrading@2026#Secure --silent 2>/dev/null; then
      success "  MySQL 就绪"; break
    fi
    [ "$i" -eq 40 ] && error "MySQL 启动超时"
    sleep 2
  done

  info "  等待 Redis 就绪..."
  for i in $(seq 1 15); do
    if docker compose exec -T redis redis-cli -a "${REDIS_PASSWORD:-Redis@2026#Secure!}" ping 2>/dev/null | grep -q PONG; then
      success "  Redis 就绪"; break
    fi
    [ "$i" -eq 15 ] && warn "  Redis 未响应，将降级运行"
    sleep 1
  done
else
  warn "Step 1 已跳过（--skip-docker）"
fi

# ─────────────────────────────────────────
#  Step 2: 安装 Go 依赖
# ─────────────────────────────────────────
info "Step 2 · 整理 Go 依赖..."
for svc in auth trading community gateway; do
  cd "$ROOT/services/$svc" && go mod tidy -e 2>/dev/null || true
done
success "Step 2 完成"

# ─────────────────────────────────────────
#  Step 3: 种子数据
# ─────────────────────────────────────────
if [ "$SKIP_SEED" = false ]; then
  info "Step 3 · 写入社区种子数据..."
  cd "$ROOT/services/community"
  go run cmd/seed/main.go 2>/dev/null && success "Step 3 完成" || warn "种子数据写入失败（可能已存在），继续启动"
else
  warn "Step 3 已跳过（--skip-seed）"
fi

# ─────────────────────────────────────────
#  Step 4: 启动四个后端服务
# ─────────────────────────────────────────
info "Step 4 · 启动后端微服务..."

cd "$ROOT/services/auth"
go run cmd/server/main.go > "$LOG_DIR/auth.log" 2>&1 &
PIDS+=($!)
success "  auth-service     启动  → :8001"

sleep 1  # 给 auth 服务一点时间先起来

cd "$ROOT/services/trading"
go run cmd/server/main.go > "$LOG_DIR/trading.log" 2>&1 &
PIDS+=($!)
success "  trading-service  启动  → :8002"

cd "$ROOT/services/community"
go run cmd/server/main.go > "$LOG_DIR/community.log" 2>&1 &
PIDS+=($!)
success "  community-service 启动 → :8003"

sleep 1

cd "$ROOT/services/gateway"
JWT_SECRET="Tr@d1ngSys#JWT$Secret2026!xK9mP" go run cmd/server/main.go > "$LOG_DIR/gateway.log" 2>&1 &
PIDS+=($!)
success "  gateway          启动  → :8000"

# ─────────────────────────────────────────
#  Step 5: 启动前端（可选）
# ─────────────────────────────────────────
if [ "$BACKEND_ONLY" = false ]; then
  info "Step 5 · 安装并启动前端..."

  cd "$ROOT"
  pnpm install --frozen-lockfile 2>/dev/null || pnpm install

  # 用户端 client
  pnpm --filter @trading/client dev > "$LOG_DIR/client.log" 2>&1 &
  PIDS+=($!)
  success "  client (用户端)    启动  → :5173"

  # 管理后台三件套
  pnpm --filter @trading/admin-shell dev > "$LOG_DIR/admin-shell.log" 2>&1 &
  PIDS+=($!)
  success "  admin-shell (基座) 启动  → :3000"

  pnpm --filter @trading/admin-trading dev > "$LOG_DIR/admin-trading.log" 2>&1 &
  PIDS+=($!)
  success "  admin-trading (子应用) 启动 → :3001"

  pnpm --filter @trading/admin-community dev > "$LOG_DIR/admin-community.log" 2>&1 &
  PIDS+=($!)
  success "  admin-community (子应用) 启动 → :3002"
else
  warn "Step 5 已跳过（--backend-only）"
fi

# ─────────────────────────────────────────
#  启动完成
# ─────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  淘好物 — 全部服务已启动${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${CYAN}后端入口（统一网关）${NC}"
echo -e "    API Gateway     →  http://localhost:8000/api/v1"
echo ""
echo -e "  ${CYAN}前端${NC}"
echo -e "    用户端          →  http://localhost:5173"
echo -e "    管理后台        →  http://localhost:3000"
echo ""
echo -e "  ${CYAN}直连各服务（调试用）${NC}"
echo -e "    auth-service    →  http://localhost:8001"
echo -e "    trading-service →  http://localhost:8002"
echo -e "    community-service → http://localhost:8003"
echo ""
echo -e "  ${CYAN}中间件${NC}"
echo -e "    RabbitMQ 管理UI →  http://localhost:15672  (guest/guest)"
echo ""
echo -e "  ${CYAN}日志${NC}  →  .logs/"
echo -e "  按 ${YELLOW}Ctrl+C${NC} 停止所有服务"
echo ""

wait
