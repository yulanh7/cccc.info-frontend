# 构建阶段
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

# 复制生产环境变量（用于内联 NEXT_PUBLIC_）
COPY .env.production ./

COPY . .

ENV NODE_ENV=production
# 限制 Node heap 内存，避免 build 时 OOM（建议 4GB，根据服务器内存调整）
ENV NODE_OPTIONS=--max-old-space-size=4096

RUN npm run build

# 运行阶段（最小镜像）
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建 non-root 用户
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nextjs -u 1001 -G nodejs

# 只复制必要文件
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 如果项目有 public 目录（logo、图片等），取消注释下面这行
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000
ENV PORT=3000

# 可选：健康检查（生产推荐）
HEALTHCHECK --interval=30s --timeout=3s CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

CMD ["node", "server.js"]