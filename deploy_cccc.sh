#!/usr/bin/env bash
set -euo pipefail

### === 路径与名称 ===
FRONT_DIR="/opt/apps/cccc.info-frontend"
BACK_DIR="/opt/apps/cccc.info-backend"

FRONT_IMAGE="cccc-frontend:latest"
BACK_IMAGE="cccc-backend:latest"

FRONT_CONTAINER="cccc-frontend"
BACK_CONTAINER="cccc-backend"

# 持久化目录
UPLOADS_DIR="/opt/uploads"
BACK_INSTANCE_DIR="/opt/cccc-data/instance"

# 端口
FRONT_PORT="3000"
BACK_PORT="5000"

# 健康检查通用超时（秒）
FRONT_HEALTH_TIMEOUT=30
BACK_HEALTH_TIMEOUT=60

log() { printf "\033[1;34m== %s\033[0m\n" "$*"; }
warn() { printf "\033[1;33m!! %s\033[0m\n" "$*"; }
err() { printf "\033[1;31m!! %s\033[0m\n" "$*"; }

### === 预检 ===
command -v git >/dev/null || { err "git 未安装"; exit 1; }
command -v docker >/dev/null || { err "docker 未安装"; exit 1; }

[[ -d "$FRONT_DIR/.git" ]] || { err "找不到前端仓库：$FRONT_DIR"; exit 1; }
[[ -d "$BACK_DIR/.git"  ]] || { err "找不到后端仓库：$BACK_DIR"; exit 1; }

[[ -f "$FRONT_DIR/.env.production" ]] || { err "缺少前端环境文件 $FRONT_DIR/.env.production"; exit 1; }
[[ -f "$BACK_DIR/.env" ]] || { err "缺少后端环境文件 $BACK_DIR/.env"; exit 1; }

# 必须与后端代码一致：
#   UPLOAD_FOLDER=/app/uploads
#   SQLALCHEMY_DATABASE_URI=sqlite:////app/instance/database.db
mkdir -p "$UPLOADS_DIR"
mkdir -p "$BACK_INSTANCE_DIR"

log "Pull 最新代码"
git -C "$FRONT_DIR" fetch --all --prune
git -C "$FRONT_DIR" reset --hard origin/main
git -C "$BACK_DIR"  fetch --all --prune
git -C "$BACK_DIR"  reset --hard origin/main

# ---- 首次部署：如宿主机无数据库则从仓库拷贝 seed ----
SEED_DB="$BACK_DIR/instance/database.db"
TARGET_DB="$BACK_INSTANCE_DIR/database.db"
if [[ ! -f "$TARGET_DB" ]] && [[ -f "$SEED_DB" ]]; then
  log "初始化数据库：拷贝 seed DB 到 $TARGET_DB"
  cp -f "$SEED_DB" "$TARGET_DB"
fi
chmod 755 "$BACK_INSTANCE_DIR"
[[ -f "$TARGET_DB" ]] && chmod 644 "$TARGET_DB"

### === 构建前轻量清理（防止空间被缓存与悬空占满） ===
log "Docker 轻量清理"
# 删除已退出容器
docker ps -aq -f status=exited | xargs -r docker rm
# 删除悬空镜像（<none>）
docker images -f dangling=true -q | xargs -r docker rmi
# 清理构建缓存
docker builder prune -af

log "构建前端镜像"
docker build -t "$FRONT_IMAGE" "$FRONT_DIR"

log "构建后端镜像"
docker build -t "$BACK_IMAGE" "$BACK_DIR"

log "停止并删除旧容器（若存在）"
docker rm -f "$FRONT_CONTAINER" >/dev/null 2>&1 || true
docker rm -f "$BACK_CONTAINER"  >/dev/null 2>&1 || true

### === 启动后端：加容器级 HEALTHCHECK（Python 一行流） ===
# 说明：
# - 优先访问 /api/health，若 404 再访问 /
# - 只要能连通且状态码 < 500 视为健康
# - 不依赖 curl/wget；镜像里有 Python 即可
BACK_HEALTH_CMD='python -c "import sys,urllib.request,urllib.error; \
  def ok(u): \
    try: r=urllib.request.urlopen(u,timeout=3); return r.status<500; \
    except urllib.error.HTTPError as e: \
      return e.code<500; \
    except Exception: \
      return False; \
  sys.exit(0 if (ok(\"http://127.0.0.1:5000/api/health\") or ok(\"http://127.0.0.1:5000/\")) else 1)"'

log "启动后端（挂载 uploads 与 instance，附带 HEALTHCHECK）"
docker run -d --name "$BACK_CONTAINER" \
  --restart unless-stopped \
  -p ${BACK_PORT}:5000 \
  --env-file "$BACK_DIR/.env" \
  -v "$UPLOADS_DIR":/app/uploads \
  -v "$BACK_INSTANCE_DIR":/app/instance \
  --health-cmd "$BACK_HEALTH_CMD" \
  --health-interval=15s \
  --health-timeout=5s \
  --health-retries=3 \
  "$BACK_IMAGE"

log "启动前端"
docker run -d --name "$FRONT_CONTAINER" \
  --restart unless-stopped \
  -p ${FRONT_PORT}:3000 \
  --env-file "$FRONT_DIR/.env.production" \
  -e HOST=0.0.0.0 \
  -e PORT=3000 \
  -e NODE_ENV=production \
  "$FRONT_IMAGE"

### === 健康检查工具函数 ===
http_reachable() {
  # 任何能拿到非 000 的 HTTP 状态码都视为“联通”
  local url="$1"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || true)
  [[ -n "$code" && "$code" != "000" ]]
}

wait_container_healthy() {
  # $1: container name
  # $2: timeout seconds
  local name="$1" timeout="$2" start ts status has_health
  start=$(date +%s)
  # 判断镜像是否定义了 Health（Dockerfile 或 --health-cmd）
  has_health=$(docker inspect --format='{{json .State.Health}}' "$name" 2>/dev/null | grep -c '"Status"')
  if [[ "$has_health" -eq 0 ]]; then
    warn "容器 $name 未定义 HEALTHCHECK，改用 HTTP 兜底检测"
    # 兜底：每 1s 探测一次 /api/health 或 /
    while :; do
      ts=$(date +%s)
      if [[ $((ts-start)) -ge $timeout ]]; then
        return 1
      fi
      if http_reachable "http://127.0.0.1:${BACK_PORT}/api/health" || http_reachable "http://127.0.0.1:${BACK_PORT}/"; then
        return 0
      fi
      sleep 1
    done
  else
    # 有健康检查：轮询 .State.Health.Status
    while :; do
      ts=$(date +%s)
      if [[ $((ts-start)) -ge $timeout ]]; then
        return 1
      fi
      status=$(docker inspect --format='{{.State.Health.Status}}' "$name" 2>/dev/null || echo "unknown")
      case "$status" in
        healthy) return 0 ;;
        unhealthy) return 2 ;;  # 直接失败，便于提示日志
        starting|*) sleep 1 ;;
      esac
    done
  fi
}

### === 健康检查（前端） ===
log "健康检查（前端）"
for ((i=1;i<=FRONT_HEALTH_TIMEOUT;i++)); do
  if curl -fsI "http://127.0.0.1:${FRONT_PORT}" >/dev/null; then
    log "前端 OK"
    break
  fi
  sleep 1
  if [[ $i -eq $FRONT_HEALTH_TIMEOUT ]]; then
    warn "前端检查失败：请查看 docker logs ${FRONT_CONTAINER}"
  fi
done

### === 健康检查（后端，优先容器级 HEALTHCHECK） ===
log "健康检查（后端）"
if wait_container_healthy "$BACK_CONTAINER" "$BACK_HEALTH_TIMEOUT"; then
  log "后端容器健康（HEALTHCHECK/HTTP）"
else
  rc=$?
  if [[ $rc -eq 2 ]]; then
    err "后端容器 unhealthy：请查看 docker logs ${BACK_CONTAINER}"
  else
    err "后端检查超时：请查看 docker logs ${BACK_CONTAINER}"
  fi
fi

log "完成：Nginx 反代下访问 https://canberra-ccc.info/"
