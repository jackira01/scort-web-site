#!/bin/bash

# Script de despliegue para producción - Prepago Ya
# Uso: ./scripts/deploy.sh [staging|production]

set -e  # Salir si cualquier comando falla

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

# Verificar argumentos
ENVIRONMENT=${1:-staging}

if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    log_error "Ambiente inválido. Usa 'staging' o 'production'"
    exit 1
fi

log "Iniciando despliegue para ambiente: $ENVIRONMENT"

# Verificar que estamos en el directorio correcto
if [[ ! -f "package.json" ]]; then
    log_error "Este script debe ejecutarse desde el directorio raíz del proyecto"
    exit 1
fi

# Verificar que Docker está instalado y funcionando
if ! command -v docker &> /dev/null; then
    log_error "Docker no está instalado"
    exit 1
fi

if ! docker info &> /dev/null; then
    log_error "Docker no está funcionando"
    exit 1
fi

# Verificar que pnpm está instalado
if ! command -v pnpm &> /dev/null; then
    log_error "pnpm no está instalado"
    exit 1
fi

# Función para backup de base de datos
backup_database() {
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log "Creando backup de base de datos..."
        BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        
        if docker ps | grep -q "prepago-ya-mongodb-prod"; then
            docker exec prepago-ya-mongodb-prod mongodump --out "/backup/$(date +%Y%m%d_%H%M%S)" || {
                log_warning "No se pudo crear backup automático de MongoDB"
            }
        else
            log_warning "Contenedor de MongoDB no encontrado, saltando backup"
        fi
    fi
}

# Función para verificar salud de servicios
check_health() {
    local max_attempts=30
    local attempt=1
    
    log "Verificando salud de servicios..."
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "http://localhost:5000/api/health" > /dev/null 2>&1; then
            log_success "Backend está funcionando"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            log_error "Backend no responde después de $max_attempts intentos"
            return 1
        fi
        
        log "Intento $attempt/$max_attempts - Esperando que el backend esté listo..."
        sleep 5
        ((attempt++))
    done
    
    attempt=1
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "http://localhost:3000/api/health" > /dev/null 2>&1; then
            log_success "Frontend está funcionando"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            log_error "Frontend no responde después de $max_attempts intentos"
            return 1
        fi
        
        log "Intento $attempt/$max_attempts - Esperando que el frontend esté listo..."
        sleep 5
        ((attempt++))
    done
}

# Función principal de despliegue
deploy() {
    local compose_file
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        compose_file="docker-compose.prod.yml"
    else
        compose_file="docker-compose.staging.yml"
    fi
    
    # Verificar que el archivo compose existe
    if [[ ! -f "$compose_file" ]]; then
        log_error "Archivo $compose_file no encontrado"
        exit 1
    fi
    
    # Crear backup si es producción
    backup_database
    
    # Instalar dependencias
    log "Instalando dependencias..."
    pnpm install --frozen-lockfile
    
    # Build de la aplicación
    log "Construyendo aplicación..."
    pnpm run build
    
    # Detener servicios existentes
    log "Deteniendo servicios existentes..."
    docker-compose -f "$compose_file" down || true
    
    # Construir y levantar servicios
    log "Construyendo y levantando servicios..."
    docker-compose -f "$compose_file" up -d --build
    
    # Esperar a que los servicios estén listos
    log "Esperando a que los servicios estén listos..."
    sleep 30
    
    # Verificar salud de servicios
    if check_health; then
        log_success "Despliegue completado exitosamente"
        
        # Limpiar imágenes Docker antiguas
        log "Limpiando imágenes Docker antiguas..."
        docker system prune -f
        
        # Mostrar estado de servicios
        log "Estado de servicios:"
        docker-compose -f "$compose_file" ps
        
    else
        log_error "Despliegue falló - servicios no están respondiendo"
        
        # Mostrar logs para debugging
        log "Logs del backend:"
        docker-compose -f "$compose_file" logs --tail=50 backend
        
        log "Logs del frontend:"
        docker-compose -f "$compose_file" logs --tail=50 frontend
        
        exit 1
    fi
}

# Función para rollback
rollback() {
    log_warning "Iniciando rollback..."
    
    local compose_file
    if [[ "$ENVIRONMENT" == "production" ]]; then
        compose_file="docker-compose.prod.yml"
    else
        compose_file="docker-compose.staging.yml"
    fi
    
    # Aquí podrías implementar lógica de rollback más sofisticada
    # Por ejemplo, usar tags de imágenes Docker anteriores
    
    log_error "Rollback no implementado completamente"
    log "Para rollback manual:"
    log "1. docker-compose -f $compose_file down"
    log "2. git checkout <commit-anterior>"
    log "3. ./scripts/deploy.sh $ENVIRONMENT"
}

# Manejar señales para cleanup
trap 'log_error "Despliegue interrumpido"; exit 1' INT TERM

# Ejecutar despliegue
log "=== Iniciando despliegue de Prepago Ya ==="
log "Ambiente: $ENVIRONMENT"
log "Fecha: $(date)"
log "Usuario: $(whoami)"
log "Directorio: $(pwd)"
log "================================================"

deploy

log_success "=== Despliegue completado ==="
log "Ambiente: $ENVIRONMENT"
log "URLs disponibles:"
if [[ "$ENVIRONMENT" == "production" ]]; then
    log "  Frontend: https://yourdomain.com"
    log "  Backend API: https://api.yourdomain.com"
else
    log "  Frontend: http://localhost:3000"
    log "  Backend API: http://localhost:5000"
fi
log "Fecha de finalización: $(date)"
log "================================================"