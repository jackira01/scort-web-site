# =======================
# Etapa base
# =======================
FROM node:18-alpine AS base

RUN npm install -g pnpm@10.13.1
WORKDIR /app
COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile


# =======================
# Etapa de build
# =======================
FROM base AS builder
COPY . .
RUN pnpm run build:prod


# =======================
# Etapa de producción
# =======================
FROM node:18-alpine AS production

RUN npm install -g pnpm@10.13.1
WORKDIR /app

# Copiar solo package.json para deps mínimas
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Copiar el build desde builder
COPY --from=builder /app/dist ./dist

# Usuario no root
RUN addgroup -g 1001 -S nodejs \
 && adduser -S backend -u 1001
USER backend

EXPOSE 5000
ENV NODE_ENV=production
CMD ["pnpm", "run", "start:prod"]
