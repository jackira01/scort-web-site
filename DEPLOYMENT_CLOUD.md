# 🚀 Guía de Despliegue en la Nube

Esta guía detalla cómo desplegar **Scort Web Site** en **Vercel** (frontend) y **Render** (backend + base de datos).

## 📋 Prerrequisitos

- Cuenta en [Vercel](https://vercel.com)
- Cuenta en [Render](https://render.com)
- Repositorio en GitHub/GitLab
- Variables de entorno configuradas

## 🎯 Arquitectura de Despliegue

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel        │    │   Render        │    │   Render        │
│   (Frontend)    │───▶│   (Backend)     │───▶│   (MongoDB)     │
│   Next.js       │    │   Node.js/TS    │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Configuración del Backend en Render

### 1. Crear Servicio Web

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Clic en "New" → "Web Service"
3. Conecta tu repositorio GitHub
4. Configura:
   - **Name**: `scort-backend`
   - **Region**: `Oregon (US West)`
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `pnpm run build:render`
   - **Start Command**: `pnpm run start:render`

### 2. Variables de Entorno en Render

En la sección "Environment", agrega:

```bash
NODE_ENV=production
PORT=5000
MONGO_URI=[Se configurará con la base de datos]
JWT_SECRET=[Generar secreto seguro]
CORS_ORIGIN=https://tu-app.vercel.app
MAILJET_API_KEY=[Tu API key de Mailjet]
MAILJET_SECRET_KEY=[Tu secret key de Mailjet]
FRONTEND_URL=https://tu-app.vercel.app
```

### 3. Crear Base de Datos MongoDB

1. En Render Dashboard → "New" → "PostgreSQL" → "MongoDB"
2. Configura:
   - **Name**: `scort-mongodb`
   - **Region**: `Oregon (US West)`
   - **Plan**: `Starter` (gratis)

3. Una vez creada, copia la **Connection String** y actualiza `MONGO_URI` en el backend

### 4. Health Check

Render configurará automáticamente el health check en `/api/health`

## 🌐 Configuración del Frontend en Vercel

### 1. Importar Proyecto

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Clic en "New Project"
3. Importa tu repositorio GitHub
4. Configura:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `frontend`
   - **Build Command**: `pnpm run build`
   - **Output Directory**: `.next`

### 2. Variables de Entorno en Vercel

En "Settings" → "Environment Variables":

```bash
NEXT_PUBLIC_API_URL=https://scort-backend.onrender.com
NEXT_PUBLIC_APP_NAME=Scort Web Site
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_ENVIRONMENT=production
```

### 3. Configuración de Dominios

1. En "Settings" → "Domains"
2. Agrega tu dominio personalizado (opcional)
3. Configura SSL automático

## 🔄 Proceso de Despliegue Automático

### Backend (Render)

1. **Push a main** → Trigger automático
2. **Build Process**:
   ```bash
   pnpm install
   pnpm run build:prod
   ```
3. **Start Process**:
   ```bash
   NODE_ENV=production node ./dist/server.js
   ```

### Frontend (Vercel)

1. **Push a main** → Trigger automático
2. **Build Process**:
   ```bash
   pnpm install
   pnpm run build
   ```
3. **Deploy** → Automático con CDN global

## 🔍 Monitoreo y Logs

### Render
- **Logs**: Dashboard → Service → "Logs"
- **Metrics**: CPU, Memory, Response time
- **Health**: Automatic health checks

### Vercel
- **Analytics**: Dashboard → Project → "Analytics"
- **Functions**: Serverless function logs
- **Performance**: Core Web Vitals

## 🚨 Troubleshooting

### Errores Comunes

#### Backend no inicia
```bash
# Verificar logs en Render
# Común: Variables de entorno faltantes
```

#### Frontend no conecta al backend
```bash
# Verificar NEXT_PUBLIC_API_URL
# Verificar CORS_ORIGIN en backend
```

#### Base de datos no conecta
```bash
# Verificar MONGO_URI
# Verificar que la DB esté en la misma región
```

### Comandos de Debug

```bash
# Verificar build local
cd backend && pnpm run build:prod
cd frontend && pnpm run build

# Verificar variables de entorno
echo $MONGO_URI
echo $NEXT_PUBLIC_API_URL
```

## 📊 Optimizaciones de Producción

### Backend
- ✅ Clustering automático en Render
- ✅ Health checks configurados
- ✅ Auto-scaling basado en CPU
- ✅ SSL/TLS automático

### Frontend
- ✅ CDN global de Vercel
- ✅ Edge functions
- ✅ Image optimization
- ✅ Automatic compression

### Base de Datos
- ✅ Backups automáticos
- ✅ Connection pooling
- ✅ Índices optimizados
- ✅ Monitoring integrado

## 🔐 Seguridad

### Headers de Seguridad
- ✅ HTTPS forzado
- ✅ HSTS headers
- ✅ CSP configurado
- ✅ Rate limiting

### Autenticación
- ✅ JWT con secretos seguros
- ✅ CORS configurado
- ✅ Variables de entorno encriptadas

## 📈 Escalabilidad

### Render (Backend)
- **Starter**: 0.1 CPU, 512MB RAM
- **Standard**: 0.5 CPU, 2GB RAM
- **Pro**: 1 CPU, 4GB RAM

### Vercel (Frontend)
- **Hobby**: 100GB bandwidth
- **Pro**: 1TB bandwidth
- **Enterprise**: Unlimited

## 🎯 Checklist de Despliegue

- [ ] Backend desplegado en Render
- [ ] Base de datos MongoDB configurada
- [ ] Variables de entorno configuradas
- [ ] Health checks funcionando
- [ ] Frontend desplegado en Vercel
- [ ] API conectando correctamente
- [ ] SSL/HTTPS funcionando
- [ ] Dominios configurados
- [ ] Monitoreo activo
- [ ] Backups configurados

## 📞 Soporte

- **Render**: [Documentación](https://render.com/docs)
- **Vercel**: [Documentación](https://vercel.com/docs)
- **MongoDB**: [Atlas Docs](https://docs.atlas.mongodb.com)

---

**¡Tu aplicación está lista para producción! 🚀**