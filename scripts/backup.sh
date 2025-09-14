#!/bin/bash

# =============================================================================
# Script de Backup Automatizado - Scort Web Site
# =============================================================================
# Este script realiza backups completos de:
# - Base de datos MongoDB
# - Archivos de configuración
# - Logs importantes
# - Certificados SSL
# =============================================================================

set -euo pipefail  # Salir en caso de error

# Configuración
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_BASE_DIR="${BACKUP_DIR:-/var/backups/scort-web-site}"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="$BACKUP_BASE_DIR/$DATE"
LOG_FILE="$BACKUP_BASE_DIR/backup.log"
RETENTION_DAYS=${RETENTION_DAYS:-30}
COMPRESSION=${COMPRESSION:-true}
ENCRYPTION=${ENCRYPTION:-false}
ENCRYPTION_KEY=${ENCRYPTION_KEY:-""}

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función de logging
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} $message"
            echo "[$timestamp] [INFO] $message" >> "$LOG_FILE"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message"
            echo "[$timestamp] [WARN] $message" >> "$LOG_FILE"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message"
            echo "[$timestamp] [ERROR] $message" >> "$LOG_FILE"
            ;;
        "DEBUG")
            if [[ "${DEBUG:-false}" == "true" ]]; then
                echo -e "${BLUE}[DEBUG]${NC} $message"
                echo "[$timestamp] [DEBUG] $message" >> "$LOG_FILE"
            fi
            ;;
    esac
}

# Función para verificar dependencias
check_dependencies() {
    log "INFO" "Verificando dependencias..."
    
    local deps=("mongodump" "tar" "gzip")
    
    if [[ "$ENCRYPTION" == "true" ]]; then
        deps+=("gpg")
    fi
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            log "ERROR" "Dependencia faltante: $dep"
            exit 1
        fi
    done
    
    log "INFO" "Todas las dependencias están disponibles"
}

# Función para crear directorio de backup
setup_backup_dir() {
    log "INFO" "Configurando directorio de backup: $BACKUP_DIR"
    
    # Crear directorio base si no existe
    if [[ ! -d "$BACKUP_BASE_DIR" ]]; then
        mkdir -p "$BACKUP_BASE_DIR"
        log "INFO" "Directorio base creado: $BACKUP_BASE_DIR"
    fi
    
    # Crear directorio de backup específico
    mkdir -p "$BACKUP_DIR"
    
    # Crear subdirectorios
    mkdir -p "$BACKUP_DIR/database"
    mkdir -p "$BACKUP_DIR/config"
    mkdir -p "$BACKUP_DIR/logs"
    mkdir -p "$BACKUP_DIR/ssl"
    mkdir -p "$BACKUP_DIR/uploads"
    
    log "INFO" "Estructura de directorios creada"
}

# Función para backup de MongoDB
backup_database() {
    log "INFO" "Iniciando backup de base de datos..."
    
    # Cargar variables de entorno
    if [[ -f "$PROJECT_ROOT/backend/.env.production" ]]; then
        source "$PROJECT_ROOT/backend/.env.production"
    elif [[ -f "$PROJECT_ROOT/backend/.env" ]]; then
        source "$PROJECT_ROOT/backend/.env"
    else
        log "ERROR" "No se encontró archivo de configuración de base de datos"
        return 1
    fi
    
    if [[ -z "${MONGO_URI:-}" ]]; then
        log "ERROR" "MONGO_URI no está configurado"
        return 1
    fi
    
    # Extraer información de la URI
    local db_name
    if [[ "$MONGO_URI" =~ mongodb.*://.*/(.*)(\?.*)?$ ]]; then
        db_name="${BASH_REMATCH[1]}"
    else
        log "ERROR" "No se pudo extraer el nombre de la base de datos de MONGO_URI"
        return 1
    fi
    
    log "INFO" "Realizando backup de la base de datos: $db_name"
    
    # Realizar mongodump
    if mongodump --uri="$MONGO_URI" --out="$BACKUP_DIR/database" --gzip; then
        log "INFO" "Backup de base de datos completado exitosamente"
        
        # Crear archivo de metadatos
        cat > "$BACKUP_DIR/database/metadata.json" << EOF
{
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "database": "$db_name",
    "mongo_version": "$(mongodump --version | head -n1)",
    "backup_type": "full",
    "compression": "gzip"
}
EOF
        
    else
        log "ERROR" "Falló el backup de base de datos"
        return 1
    fi
}

# Función para backup de configuraciones
backup_config() {
    log "INFO" "Iniciando backup de configuraciones..."
    
    local config_files=(
        "$PROJECT_ROOT/backend/.env.production"
        "$PROJECT_ROOT/backend/.env"
        "$PROJECT_ROOT/frontend/.env.production"
        "$PROJECT_ROOT/frontend/.env.local"
        "$PROJECT_ROOT/docker-compose.prod.yml"
        "$PROJECT_ROOT/docker-compose.yml"
        "$PROJECT_ROOT/ecosystem.config.js"
        "$PROJECT_ROOT/nginx/nginx.conf"
        "$PROJECT_ROOT/package.json"
        "$PROJECT_ROOT/backend/package.json"
        "$PROJECT_ROOT/frontend/package.json"
        "$PROJECT_ROOT/security.config.js"
        "$PROJECT_ROOT/monitoring.config.js"
    )
    
    for file in "${config_files[@]}"; do
        if [[ -f "$file" ]]; then
            local relative_path="${file#$PROJECT_ROOT/}"
            local target_dir="$BACKUP_DIR/config/$(dirname "$relative_path")"
            
            mkdir -p "$target_dir"
            cp "$file" "$target_dir/"
            
            log "DEBUG" "Copiado: $relative_path"
        else
            log "WARN" "Archivo no encontrado: $file"
        fi
    done
    
    log "INFO" "Backup de configuraciones completado"
}

# Función para backup de logs
backup_logs() {
    log "INFO" "Iniciando backup de logs..."
    
    local log_dirs=(
        "$PROJECT_ROOT/logs"
        "/var/log/nginx"
        "$HOME/.pm2/logs"
    )
    
    for log_dir in "${log_dirs[@]}"; do
        if [[ -d "$log_dir" ]]; then
            local dir_name=$(basename "$log_dir")
            
            # Copiar logs de los últimos 7 días
            find "$log_dir" -name "*.log" -mtime -7 -exec cp {} "$BACKUP_DIR/logs/" \;
            
            log "DEBUG" "Logs copiados desde: $log_dir"
        else
            log "WARN" "Directorio de logs no encontrado: $log_dir"
        fi
    done
    
    log "INFO" "Backup de logs completado"
}

# Función para backup de certificados SSL
backup_ssl() {
    log "INFO" "Iniciando backup de certificados SSL..."
    
    local ssl_dirs=(
        "$PROJECT_ROOT/nginx/ssl"
        "/etc/letsencrypt"
        "/etc/ssl/certs"
    )
    
    for ssl_dir in "${ssl_dirs[@]}"; do
        if [[ -d "$ssl_dir" ]]; then
            local dir_name=$(basename "$ssl_dir")
            
            cp -r "$ssl_dir" "$BACKUP_DIR/ssl/$dir_name"
            
            log "DEBUG" "Certificados copiados desde: $ssl_dir"
        else
            log "WARN" "Directorio SSL no encontrado: $ssl_dir"
        fi
    done
    
    log "INFO" "Backup de certificados SSL completado"
}

# Función para backup de uploads/archivos de usuario
backup_uploads() {
    log "INFO" "Iniciando backup de archivos de usuario..."
    
    local upload_dirs=(
        "$PROJECT_ROOT/backend/uploads"
        "$PROJECT_ROOT/frontend/public/uploads"
    )
    
    for upload_dir in "${upload_dirs[@]}"; do
        if [[ -d "$upload_dir" ]]; then
            local dir_name=$(basename "$(dirname "$upload_dir")")_$(basename "$upload_dir")
            
            cp -r "$upload_dir" "$BACKUP_DIR/uploads/$dir_name"
            
            log "DEBUG" "Uploads copiados desde: $upload_dir"
        else
            log "WARN" "Directorio de uploads no encontrado: $upload_dir"
        fi
    done
    
    log "INFO" "Backup de archivos de usuario completado"
}

# Función para comprimir backup
compress_backup() {
    if [[ "$COMPRESSION" != "true" ]]; then
        log "INFO" "Compresión deshabilitada"
        return 0
    fi
    
    log "INFO" "Comprimiendo backup..."
    
    local archive_name="scort-backup-$DATE.tar.gz"
    local archive_path="$BACKUP_BASE_DIR/$archive_name"
    
    if tar -czf "$archive_path" -C "$BACKUP_BASE_DIR" "$DATE"; then
        log "INFO" "Backup comprimido exitosamente: $archive_name"
        
        # Eliminar directorio sin comprimir
        rm -rf "$BACKUP_DIR"
        
        # Actualizar ruta del backup
        BACKUP_PATH="$archive_path"
        
        # Mostrar tamaño del archivo
        local size=$(du -h "$archive_path" | cut -f1)
        log "INFO" "Tamaño del backup: $size"
        
    else
        log "ERROR" "Falló la compresión del backup"
        return 1
    fi
}

# Función para encriptar backup
encrypt_backup() {
    if [[ "$ENCRYPTION" != "true" ]]; then
        log "INFO" "Encriptación deshabilitada"
        return 0
    fi
    
    if [[ -z "$ENCRYPTION_KEY" ]]; then
        log "ERROR" "ENCRYPTION_KEY no está configurado"
        return 1
    fi
    
    log "INFO" "Encriptando backup..."
    
    local encrypted_file="${BACKUP_PATH}.gpg"
    
    if echo "$ENCRYPTION_KEY" | gpg --batch --yes --passphrase-fd 0 --symmetric --cipher-algo AES256 --output "$encrypted_file" "$BACKUP_PATH"; then
        log "INFO" "Backup encriptado exitosamente"
        
        # Eliminar archivo sin encriptar
        rm "$BACKUP_PATH"
        
        # Actualizar ruta del backup
        BACKUP_PATH="$encrypted_file"
        
    else
        log "ERROR" "Falló la encriptación del backup"
        return 1
    fi
}

# Función para limpiar backups antiguos
cleanup_old_backups() {
    log "INFO" "Limpiando backups antiguos (más de $RETENTION_DAYS días)..."
    
    local deleted_count=0
    
    # Buscar y eliminar backups antiguos
    while IFS= read -r -d '' file; do
        rm "$file"
        ((deleted_count++))
        log "DEBUG" "Eliminado: $(basename "$file")"
    done < <(find "$BACKUP_BASE_DIR" -name "scort-backup-*.tar.gz*" -mtime +"$RETENTION_DAYS" -print0)
    
    # Buscar y eliminar directorios antiguos
    while IFS= read -r -d '' dir; do
        rm -rf "$dir"
        ((deleted_count++))
        log "DEBUG" "Eliminado directorio: $(basename "$dir")"
    done < <(find "$BACKUP_BASE_DIR" -maxdepth 1 -type d -name "[0-9]*_[0-9]*" -mtime +"$RETENTION_DAYS" -print0)
    
    if [[ $deleted_count -gt 0 ]]; then
        log "INFO" "Eliminados $deleted_count backups antiguos"
    else
        log "INFO" "No se encontraron backups antiguos para eliminar"
    fi
}

# Función para verificar integridad del backup
verify_backup() {
    log "INFO" "Verificando integridad del backup..."
    
    if [[ "$COMPRESSION" == "true" ]]; then
        if [[ "$ENCRYPTION" == "true" ]]; then
            # Verificar archivo encriptado
            if echo "$ENCRYPTION_KEY" | gpg --batch --yes --passphrase-fd 0 --decrypt "$BACKUP_PATH" | tar -tzf - > /dev/null; then
                log "INFO" "Backup encriptado verificado exitosamente"
            else
                log "ERROR" "Falló la verificación del backup encriptado"
                return 1
            fi
        else
            # Verificar archivo comprimido
            if tar -tzf "$BACKUP_PATH" > /dev/null; then
                log "INFO" "Backup comprimido verificado exitosamente"
            else
                log "ERROR" "Falló la verificación del backup comprimido"
                return 1
            fi
        fi
    else
        # Verificar directorio
        if [[ -d "$BACKUP_PATH" ]]; then
            log "INFO" "Directorio de backup verificado exitosamente"
        else
            log "ERROR" "Directorio de backup no encontrado"
            return 1
        fi
    fi
}

# Función para enviar notificación
send_notification() {
    local status=$1
    local message=$2
    
    # Webhook de notificación
    if [[ -n "${BACKUP_WEBHOOK_URL:-}" ]]; then
        local payload=$(cat << EOF
{
    "status": "$status",
    "message": "$message",
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "environment": "${NODE_ENV:-production}",
    "backup_path": "${BACKUP_PATH:-}"
}
EOF
        )
        
        curl -X POST "$BACKUP_WEBHOOK_URL" \
             -H "Content-Type: application/json" \
             -d "$payload" \
             --silent --show-error || log "WARN" "Falló el envío de notificación webhook"
    fi
    
    # Email de notificación
    if [[ -n "${BACKUP_EMAIL:-}" ]] && command -v mail &> /dev/null; then
        echo "$message" | mail -s "Backup Scort Web Site - $status" "$BACKUP_EMAIL" || \
            log "WARN" "Falló el envío de notificación por email"
    fi
}

# Función principal
main() {
    local start_time=$(date +%s)
    
    log "INFO" "=== Iniciando backup de Scort Web Site ==="
    log "INFO" "Fecha: $(date)"
    log "INFO" "Directorio de backup: $BACKUP_DIR"
    
    # Verificar dependencias
    check_dependencies
    
    # Configurar directorio de backup
    setup_backup_dir
    
    # Realizar backups
    local backup_success=true
    
    backup_database || backup_success=false
    backup_config || backup_success=false
    backup_logs || backup_success=false
    backup_ssl || backup_success=false
    backup_uploads || backup_success=false
    
    if [[ "$backup_success" == "true" ]]; then
        # Comprimir si está habilitado
        compress_backup || backup_success=false
        
        # Encriptar si está habilitado
        if [[ "$backup_success" == "true" ]]; then
            encrypt_backup || backup_success=false
        fi
        
        # Verificar integridad
        if [[ "$backup_success" == "true" ]]; then
            verify_backup || backup_success=false
        fi
    fi
    
    # Limpiar backups antiguos
    cleanup_old_backups
    
    # Calcular tiempo transcurrido
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [[ "$backup_success" == "true" ]]; then
        local success_message="Backup completado exitosamente en ${duration}s. Archivo: ${BACKUP_PATH:-$BACKUP_DIR}"
        log "INFO" "$success_message"
        send_notification "SUCCESS" "$success_message"
    else
        local error_message="Backup falló después de ${duration}s. Revisar logs para más detalles."
        log "ERROR" "$error_message"
        send_notification "FAILURE" "$error_message"
        exit 1
    fi
    
    log "INFO" "=== Backup finalizado ==="
}

# Función de ayuda
show_help() {
    cat << EOF
Script de Backup Automatizado - Scort Web Site

Uso: $0 [opciones]

Opciones:
    -h, --help              Mostrar esta ayuda
    -d, --debug             Habilitar modo debug
    -c, --compress          Habilitar compresión (por defecto: true)
    -e, --encrypt           Habilitar encriptación (requiere ENCRYPTION_KEY)
    -r, --retention DAYS    Días de retención (por defecto: 30)
    -o, --output DIR        Directorio de salida (por defecto: /var/backups/scort-web-site)

Variables de entorno:
    BACKUP_DIR              Directorio base de backups
    RETENTION_DAYS          Días de retención de backups
    COMPRESSION             Habilitar compresión (true/false)
    ENCRYPTION              Habilitar encriptación (true/false)
    ENCRYPTION_KEY          Clave de encriptación
    BACKUP_WEBHOOK_URL      URL para notificaciones webhook
    BACKUP_EMAIL            Email para notificaciones
    DEBUG                   Habilitar modo debug (true/false)

Ejemplos:
    $0                      # Backup básico
    $0 --debug              # Backup con debug
    $0 --encrypt            # Backup encriptado
    $0 --retention 7        # Retener solo 7 días

EOF
}

# Procesar argumentos de línea de comandos
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -d|--debug)
            DEBUG=true
            shift
            ;;
        -c|--compress)
            COMPRESSION=true
            shift
            ;;
        -e|--encrypt)
            ENCRYPTION=true
            shift
            ;;
        -r|--retention)
            RETENTION_DAYS="$2"
            shift 2
            ;;
        -o|--output)
            BACKUP_BASE_DIR="$2"
            shift 2
            ;;
        *)
            log "ERROR" "Opción desconocida: $1"
            show_help
            exit 1
            ;;
    esac
done

# Ejecutar función principal
main "$@"