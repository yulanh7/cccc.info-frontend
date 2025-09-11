FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
# 关键：把 .env.production 放进来，供“构建时”读取
COPY .env.production ./.env.production

# 再复制源码
COPY . .

# 构建
ENV NODE_ENV=production
RUN npm run build

# 运行阶段
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
EXPOSE 3000
CMD ["npm", "run", "start"]
