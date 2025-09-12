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

### === 预检 ===
command -v git >/dev/null || { echo "git 未安装"; exit 1; }
command -v docker >/dev/null || { echo "docker 未安装"; exit 1; }

[[ -d "$FRONT_DIR/.git" ]] || { echo "找不到前端仓库：$FRONT_DIR"; exit 1; }
[[ -d "$BACK_DIR/.git"  ]] || { echo "找不到后端仓库：$BACK_DIR"; exit 1; }

[[ -f "$FRONT_DIR/.env.production" ]] || { echo "缺少前端环境文件 $FRONT_DIR/.env.production"; exit 1; }
[[ -f "$BACK_DIR/.env" ]] || { echo "缺少后端环境文件 $BACK_DIR/.env"; exit 1; }

# 必须与后端代码一致：
#   UPLOAD_FOLDER=/app/uploads
#   SQLALCHEMY_DATABASE_URI=sqlite:////app/instance/database.db
mkdir -p "$UPLOADS_DIR"
mkdir -p "$BACK_INSTANCE_DIR"

echo "== Pull 最新代码 =="
git -C "$FRONT_DIR" fetch --all --prune
git -C "$FRONT_DIR" reset --hard origin/main
git -C "$BACK_DIR"  fetch --all --prune
git -C "$BACK_DIR"  reset --hard origin/main

# ---- 首次部署：如宿主机无数据库则从仓库拷贝 seed ----
SEED_DB="$BACK_DIR/instance/database.db"
TARGET_DB="$BACK_INSTANCE_DIR/database.db"
if [[ ! -f "$TARGET_DB" ]] && [[ -f "$SEED_DB" ]]; then
  echo "== 初始化数据库：拷贝 seed DB 到 $TARGET_DB =="
  cp -f "$SEED_DB" "$TARGET_DB"
fi
chmod 755 "$BACK_INSTANCE_DIR"
[[ -f "$TARGET_DB" ]] && chmod 644 "$TARGET_DB"

### === 构建前轻量清理（防止空间被缓存与悬空占满） ===
echo "== Docker 轻量清理 =="
# 删除已退出容器
docker ps -aq -f status=exited | xargs -r docker rm
# 删除悬空镜像（<none>）
docker images -f dangling=true -q | xargs -r docker rmi
# 清理构建缓存
docker builder prune -af

echo "== 构建前端镜像 =="
docker build -t "$FRONT_IMAGE" "$FRONT_DIR"

echo "== 构建后端镜像 =="
docker build -t "$BACK_IMAGE" "$BACK_DIR"

echo "== 停止并删除旧容器（若存在） =="
docker rm -f "$FRONT_CONTAINER" >/dev/null 2>&1 || true
docker rm -f "$BACK_CONTAINER"  >/dev/null 2>&1 || true

echo "== 启动后端（挂载 uploads 与 instance） =="
docker run -d --name "$BACK_CONTAINER" \
  --restart unless-stopped \
  -p ${BACK_PORT}:5000 \
  --env-file "$BACK_DIR/.env" \
  -v "$UPLOADS_DIR":/app/uploads \
  -v "$BACK_INSTANCE_DIR":/app/instance \
  "$BACK_IMAGE"

echo "== 启动前端 =="
docker run -d --name "$FRONT_CONTAINER" \
  --restart unless-stopped \
  -p ${FRONT_PORT}:3000 \
  --env-file "$FRONT_DIR/.env.production" \
  -e HOST=0.0.0.0 \
  -e PORT=3000 \
  -e NODE_ENV=production \
  "$FRONT_IMAGE"

### === 健康检查 ===
echo "== 健康检查（前端） =="
for i in {1..30}; do
  if curl -fsI "http://127.0.0.1:${FRONT_PORT}" >/dev/null; then
    echo "前端 OK"; break
  fi
  sleep 1
  if [ $i -eq 30 ]; then
    echo "前端检查失败：请查看 docker logs ${FRONT_CONTAINER}"
  fi
done

echo "== 健康检查（后端） =="
if curl -fsSI "http://127.0.0.1:${BACK_PORT}/api/health" >/dev/null 2>&1; then
  echo "后端健康接口 OK"
else
  # 若没有 /api/health，就用主页或一个已知 API 兜底
  if curl -fsI "http://127.0.0.1:${BACK_PORT}/" >/dev/null; then
    echo "后端 OK（无健康接口，根路径可达）"
  else
    echo "后端检查失败：请查看 docker logs ${BACK_CONTAINER}"
  fi
fi

echo "== 完成：Nginx 反代下访问 https://canberra-ccc.info/"

root@localhost:~# 

