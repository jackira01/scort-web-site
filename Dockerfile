# =======================
# Etapa base
# =======================
FROM node:18-slim AS base
RUN npm install -g pnpm@10.13.1
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/

# =======================
# Etapa de build
# =======================
FROM base AS builder
ENV NODE_ENV=development

COPY backend ./backend
COPY backend/tsconfig.json ./backend/

RUN pnpm install --filter backend... --include dev
WORKDIR /app/backend
RUN pnpm --filter backend run build:prod

# =======================
# Etapa de producción
# =======================
FROM node:18-slim AS production
RUN npm install -g pnpm@10.13.1
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/

ENV NODE_ENV=production
RUN pnpm install --filter backend --prod

COPY --from=builder /app/backend/dist ./backend/dist

RUN addgroup --system nodejs \
 && adduser --system backend --ingroup nodejs \
 && mkdir -p /app/logs \
 && chown -R backend:nodejs /app

USER backend
WORKDIR /app/backend

EXPOSE 5000

# (Opcional: Si agregaste el endpoint /ping)
# HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
#   CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000) + '/ping', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/server.js"]
