# =======================
# Etapa base
# =======================
FROM node:18-alpine AS base
RUN npm install -g pnpm@10.13.1
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/


# =======================
# Etapa de build
# =======================
FROM base AS builder

# Aseguramos entorno de desarrollo para incluir devDependencies
ENV NODE_ENV=development

# Copiar el código fuente
COPY backend ./backend
COPY tsconfig.json* ./

# Instalar dependencias (incluyendo devDependencies)
RUN pnpm install --lockfile-only=false --filter backend... --include dev

WORKDIR /app/backend

# Compilar usando el script del package.json
RUN pnpm --filter backend run build:prod


# =======================
# Etapa de producción
# =======================
FROM node:18-alpine AS production

RUN npm install -g pnpm@10.13.1
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/

# Aseguramos entorno de producción
ENV NODE_ENV=production

# Instalar solo dependencias necesarias para runtime
RUN pnpm install --lockfile-only=false --filter backend --prod

# Copiar el build desde la etapa builder
COPY --from=builder /app/backend/dist ./backend/dist

RUN addgroup -g 1001 -S nodejs \
 && adduser -S backend -u 1001 \
 && mkdir -p /app/logs \
 && chown -R backend:nodejs /app

USER backend
WORKDIR /app/backend

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000) + '/ping', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/server.js"]
