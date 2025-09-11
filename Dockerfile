# 生产构建
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# 如果你是 App Router + 运行时渲染，直接 build
RUN npm run build

# 运行阶段
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
EXPOSE 3000
# Next.js 15 通常：npm run start 等价 next start
CMD ["npm", "run", "start"]
