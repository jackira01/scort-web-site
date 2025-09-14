# Redis Setup para Desarrollo

## Descripción

Este proyecto utiliza Redis como sistema de caché para mejorar el rendimiento de la aplicación. Redis es opcional en desarrollo, pero recomendado para una experiencia completa.

## Opciones de Configuración

### Opción 1: Usar Docker Compose (Recomendado)

1. **Iniciar Redis con Docker Compose:**
   ```bash
   # Desde la raíz del proyecto
   docker-compose up redis -d
   ```

2. **Verificar que Redis está funcionando:**
   ```bash
   docker-compose ps
   ```

3. **Ver logs de Redis:**
   ```bash
   docker-compose logs redis
   ```

4. **Detener Redis:**
   ```bash
   docker-compose down
   ```

### Opción 2: Instalación Local

#### Windows
1. Descargar Redis desde: https://github.com/microsoftarchive/redis/releases
2. Instalar y ejecutar Redis
3. Redis estará disponible en `localhost:6379`

#### macOS
```bash
# Usando Homebrew
brew install redis
brew services start redis
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### Opción 3: Desarrollo sin Redis

Si no quieres usar Redis, la aplicación funcionará normalmente. El servicio de caché está diseñado para manejar la ausencia de Redis de forma elegante:

- Los errores de conexión Redis son normales y no afectan la funcionalidad
- Las operaciones de caché simplemente se omiten
- La aplicación continúa funcionando sin problemas

## Configuración

### Variables de Entorno

En tu archivo `.env` del backend, puedes configurar:

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379
```

### Verificación de Conexión

Cuando Redis está conectado, verás en los logs:
```
✅ Redis conectado exitosamente
```

Cuando Redis no está disponible, verás:
```
❌ Error de conexión Redis: Error: connect ECONNREFUSED 127.0.0.1:6379
⚠️ Redis desconectado
```

## Beneficios del Caché

Cuando Redis está activo, la aplicación cachea:
- Perfiles de usuarios
- Filtros de búsqueda
- Configuraciones del sistema
- Estadísticas
- Grupos de atributos

Esto mejora significativamente el rendimiento y reduce la carga en la base de datos.

## Comandos Útiles

### Docker Compose
```bash
# Iniciar solo Redis
docker-compose up redis -d

# Iniciar Redis y MongoDB
docker-compose up redis mongodb -d

# Ver logs en tiempo real
docker-compose logs -f redis

# Reiniciar Redis
docker-compose restart redis

# Limpiar volúmenes (elimina datos)
docker-compose down -v
```

### Cliente Redis (si está instalado localmente)
```bash
# Conectar al cliente Redis
redis-cli

# Verificar conexión
ping
# Respuesta esperada: PONG

# Ver todas las claves
keys *

# Limpiar caché
flushall
```

## Troubleshooting

### Error: "connect ECONNREFUSED 127.0.0.1:6379"
- **Causa:** Redis no está ejecutándose
- **Solución:** Iniciar Redis usando una de las opciones anteriores
- **Nota:** Este error no afecta la funcionalidad de la aplicación

### Redis no guarda datos
- Verificar que el volumen de Docker esté configurado correctamente
- Revisar permisos de escritura
- Verificar espacio en disco

### Rendimiento lento
- Verificar que Redis esté ejecutándose
- Revisar configuración de TTL en `cache.service.ts`
- Monitorear uso de memoria de Redis