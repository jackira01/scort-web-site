# Dockerfile para el backend - Optimizado para producción
FROM node:18-alpine AS base

# Instalar pnpm globalmente
RUN npm install -g pnpm@10.13.1

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias de producción
RUN pnpm install --frozen-lockfile --prod

# Etapa de build
FROM base AS builder

# Instalar todas las dependencias (incluyendo devDependencies)
RUN pnpm install --frozen-lockfile

# Copiar código fuente
COPY . .

# Compilar TypeScript
RUN pnpm run build:prod

# Etapa de producción
FROM node:18-alpine AS production

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001

# Establecer directorio de trabajo
WORKDIR /app

# Copiar dependencias de producción desde la etapa base
COPY --from=base --chown=backend:nodejs /app/node_modules ./node_modules
COPY --from=base --chown=backend:nodejs /app/package.json ./package.json

# Copiar código compilado desde la etapa builder
COPY --from=builder --chown=backend:nodejs /app/dist ./dist

# Cambiar al usuario no-root
USER backend

# Exponer puerto
EXPOSE 5000

# Variables de entorno de producción
ENV NODE_ENV=production
ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/ping', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Comando de inicio
CMD ["pnpm", "run", "start:prod"]