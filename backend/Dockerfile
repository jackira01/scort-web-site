# =======================
# Etapa base
# =======================
FROM node:18-alpine AS base

RUN npm install -g pnpm@10.13.1
WORKDIR /app
COPY package.json pnpm-lock.yaml ./

# Aquí instalamos todas las dependencias (incluye devDeps)
RUN pnpm install --frozen-lockfile


# =======================
# Etapa de build
# =======================
FROM base AS builder

# Copiar todo el código
COPY . .

# Compilar (usa las devDependencies disponibles)
RUN pnpm run build:prod


# =======================
# Etapa de producción
# =======================
FROM node:18-alpine AS production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001
WORKDIR /app

# Instalar solo dependencias de producción
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm@10.13.1 \
  && pnpm install --frozen-lockfile --prod

# Copiar dist ya compilado
COPY --from=builder --chown=backend:nodejs /app/dist ./dist

# Seguridad
USER backend

EXPOSE 5000
ENV NODE_ENV=production
ENV PORT=5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/ping', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["pnpm", "run", "start:prod"]
