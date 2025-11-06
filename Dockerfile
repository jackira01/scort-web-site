# =======================
# Etapa base
# =======================
FROM node:18-alpine AS base

RUN npm install -g pnpm@10.13.1
WORKDIR /app

# Copiar archivos de dependencias desde la RAÍZ (no backend/)
COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile


# =======================
# Etapa de build
# =======================
FROM base AS builder

# Copiar todo el código del backend
COPY ./backend .

RUN pnpm run build:prod


# =======================
# Etapa de producción
# =======================
FROM node:18-alpine AS production

RUN npm install -g pnpm@10.13.1
WORKDIR /app

# Copiar solo package.json para deps mínimas desde RAÍZ
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Copiar el build desde builder
COPY --from=builder /app/dist ./dist

# Crear directorio de logs y usuario no root
RUN addgroup -g 1001 -S nodejs \
 && adduser -S backend -u 1001 \
 && mkdir -p /app/logs \
 && chown -R backend:nodejs /app/logs
USER backend

EXPOSE 5000
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000) + '/ping', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["pnpm", "run", "start:prod"]