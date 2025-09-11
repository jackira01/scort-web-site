# 🚀 Guía de Despliegue - Scort Web Site

## Tabla de Contenidos
- [Requisitos Previos](#requisitos-previos)
- [Configuración de Entornos](#configuración-de-entornos)
- [Despliegue con Docker](#despliegue-con-docker)
- [Despliegue con PM2](#despliegue-con-pm2)
- [CI/CD con GitHub Actions](#cicd-con-github-actions)
- [Monitoreo y Logs](#monitoreo-y-logs)
- [Troubleshooting](#troubleshooting)

## Requisitos Previos

### Software Necesario
- **Node.js** 18+ 
- **pnpm** 10.13.1+
- **Docker** 24+ y Docker Compose
- **MongoDB** 7.0+ (local o Atlas)
- **Nginx** (para proxy reverso)
- **PM2** (alternativa a Docker)

### Recursos del Servidor
- **Mínimo**: 2 CPU cores, 4GB RAM, 20GB storage
- **Recomendado**: 4 CPU cores, 8GB RAM, 50GB storage
- **Producción**: 8 CPU cores, 16GB RAM, 100GB storage

## Configuración de Entornos

### 1. Variables de Entorno

#### Backend (.env.production)
```bash
# Copiar desde backend/.env.example
cp backend/.env.example backend/.env.production

# Editar con valores de producción
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/scort-web-site
JWT_SECRET=your-super-secure-jwt-secret-here
SESSION_SECRET=your-super-secure-session-secret-here
ORIGIN_ALLOWED=["https://yourdomain.com"]
NODE_ENV=production
```

#### Frontend (.env.production)
```bash
# Copiar desde frontend/.env.example
cp frontend/.env.example frontend/.env.production

# Editar con valores de producción
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_ENV=production
AUTH_SECRET=your-nextauth-secret-here
```

### 2. Configuración de SSL

```bash
# Crear directorio para certificados SSL
mkdir -p nginx/ssl

# Copiar certificados (reemplazar con tus certificados reales)
cp /path/to/your/cert.pem nginx/ssl/
cp /path/to/your/key.pem nginx/ssl/
```

## Despliegue con Docker

### Despliegue Rápido

```bash
# Clonar repositorio
git clone https://github.com/yourusername/scort-web-site.git
cd scort-web-site

# Configurar variables de entorno
cp backend/.env.example backend/.env.production
cp frontend/.env.example frontend/.env.production
# Editar archivos con valores reales

# Ejecutar script de despliegue
chmod +x scripts/deploy.sh
./scripts/deploy.sh production
```

### Despliegue Manual

```bash
# 1. Instalar dependencias
pnpm install
pnpm run install:all

# 2. Build de aplicaciones
pnpm run build

# 3. Levantar servicios con Docker
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Verificar servicios
docker-compose -f docker-compose.prod.yml ps
curl http://localhost:5000/api/health
curl http://localhost:3000/api/health
```

### Comandos Docker Útiles

```bash
# Ver logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend

# Reiniciar servicios
docker-compose -f docker-compose.prod.yml restart backend
docker-compose -f docker-compose.prod.yml restart frontend

# Detener servicios
docker-compose -f docker-compose.prod.yml down

# Limpiar sistema
docker system prune -f
docker volume prune -f
```

## Despliegue con PM2

### Instalación de PM2

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Instalar dependencias del proyecto
pnpm install
pnpm run install:all

# Build de aplicaciones
pnpm run build
```

### Configuración y Despliegue

```bash
# Iniciar aplicaciones con PM2
pm2 start ecosystem.config.js --env production

# Ver estado
pm2 status
pm2 logs

# Monitoreo
pm2 monit

# Guardar configuración
pm2 save
pm2 startup
```

### Comandos PM2 Útiles

```bash
# Reiniciar aplicaciones
pm2 restart all
pm2 restart scort-backend
pm2 restart scort-frontend

# Detener aplicaciones
pm2 stop all
pm2 delete all

# Ver logs
pm2 logs scort-backend --lines 100
pm2 logs scort-frontend --lines 100

# Reload sin downtime
pm2 reload all
```

## CI/CD con GitHub Actions

### Configuración de Secrets

En GitHub, ve a Settings > Secrets and variables > Actions y agrega:

```
PRODUCTION_HOST=your-server-ip
PRODUCTION_USER=deploy
PRODUCTION_SSH_KEY=your-private-ssh-key
STAGING_HOST=your-staging-server-ip
STAGING_USER=deploy
STAGING_SSH_KEY=your-staging-private-ssh-key
LHCI_GITHUB_APP_TOKEN=your-lighthouse-token
```

### Flujo de Despliegue

1. **Push a `develop`** → Despliegue automático a staging
2. **Push a `main`** → Despliegue automático a producción
3. **Pull Request** → Tests automáticos

### Configuración del Servidor

```bash
# En el servidor de producción
# Crear usuario de despliegue
sudo adduser deploy
sudo usermod -aG docker deploy
sudo usermod -aG sudo deploy

# Configurar SSH keys
sudo -u deploy mkdir -p /home/deploy/.ssh
sudo -u deploy touch /home/deploy/.ssh/authorized_keys
# Agregar tu clave pública SSH

# Crear directorio de aplicación
sudo mkdir -p /var/www/scort-web-site
sudo chown deploy:deploy /var/www/scort-web-site
```

## Monitoreo y Logs

### Configuración de Logs

```bash
# Crear directorio de logs
mkdir -p logs

# Configurar rotación de logs (logrotate)
sudo nano /etc/logrotate.d/scort-web-site
```

### Contenido de logrotate:
```
/var/www/scort-web-site/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 deploy deploy
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Monitoreo con PM2

```bash
# Instalar PM2 Plus para monitoreo avanzado
pm2 install pm2-server-monit

# Configurar alertas
pm2 set pm2-server-monit:conf '{"actions":[{"server":"http://localhost:3000","interval":30}]}'
```

### Health Checks

```bash
# Script de health check
#!/bin/bash
# health-check.sh

BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health)
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)

if [ "$BACKEND_HEALTH" != "200" ]; then
    echo "Backend health check failed: $BACKEND_HEALTH"
    # Enviar alerta
fi

if [ "$FRONTEND_HEALTH" != "200" ]; then
    echo "Frontend health check failed: $FRONTEND_HEALTH"
    # Enviar alerta
fi
```

## Troubleshooting

### Problemas Comunes

#### 1. Error de Conexión a MongoDB
```bash
# Verificar conexión
mongo "mongodb+srv://cluster.mongodb.net/test" --username user

# Verificar variables de entorno
echo $MONGO_URI
```

#### 2. Error de Permisos Docker
```bash
# Agregar usuario al grupo docker
sudo usermod -aG docker $USER
newgrp docker
```

#### 3. Puerto en Uso
```bash
# Verificar qué proceso usa el puerto
sudo lsof -i :3000
sudo lsof -i :5000

# Matar proceso
sudo kill -9 <PID>
```

#### 4. Problemas de SSL
```bash
# Verificar certificados
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Renovar certificados Let's Encrypt
sudo certbot renew
```

### Logs de Debugging

```bash
# Logs de Docker
docker-compose -f docker-compose.prod.yml logs -f

# Logs de aplicación
tail -f logs/backend-error.log
tail -f logs/frontend-error.log

# Logs de Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Comandos de Emergencia

```bash
# Rollback rápido
git checkout <commit-anterior>
./scripts/deploy.sh production

# Backup de emergencia
mongodump --uri="$MONGO_URI" --out=./emergency-backup-$(date +%Y%m%d_%H%M%S)

# Reinicio completo
docker-compose -f docker-compose.prod.yml down
docker system prune -f
./scripts/deploy.sh production
```

## Checklist de Despliegue

### Pre-despliegue
- [ ] Variables de entorno configuradas
- [ ] Certificados SSL válidos
- [ ] Backup de base de datos creado
- [ ] Tests pasando
- [ ] Build exitoso

### Post-despliegue
- [ ] Servicios funcionando (health checks)
- [ ] SSL funcionando correctamente
- [ ] Logs sin errores críticos
- [ ] Performance aceptable
- [ ] Funcionalidades principales funcionando

### Mantenimiento
- [ ] Monitoreo configurado
- [ ] Alertas configuradas
- [ ] Backups automáticos
- [ ] Rotación de logs
- [ ] Actualizaciones de seguridad

---

## Contacto y Soporte

Para problemas de despliegue:
1. Revisar logs de aplicación
2. Consultar esta documentación
3. Crear issue en GitHub
4. Contactar al equipo de desarrollo

**¡Importante!** Siempre hacer backup antes de despliegues en producción.