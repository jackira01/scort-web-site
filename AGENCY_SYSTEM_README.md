# Sistema Híbrido de Usuarios y Agencias

## Descripción General

Este sistema permite que los usuarios comunes puedan convertirse en agencias con límites y privilegios diferenciados para la creación y gestión de perfiles.

## Características Implementadas

### 1. Modelo de Usuario Híbrido
- **Usuarios Comunes**: Cuentas estándar con límites básicos de perfiles
- **Agencias**: Cuentas con límites extendidos y verificación independiente

### 2. Proceso de Conversión a Agencia
- Solicitud de conversión desde configuración de cuenta
- Validación administrativa requerida
- Estados: `pending`, `approved`, `rejected`

### 3. Límites Diferenciados
- **Usuarios Comunes**: Límites estándar configurables
- **Agencias**: Límites extendidos específicos
- Verificación independiente requerida para agencias

## Configuración Inicial

### Backend

1. **Ejecutar migraciones de configuración**:
   ```bash
   cd backend
   npm run init:agency-limits
   ```

2. **Verificar parámetros creados**:
   Los siguientes parámetros se crearán automáticamente:
   - `profiles.limits.agency.free_profiles_max`: 10
   - `profiles.limits.agency.paid_profiles_max`: 50
   - `profiles.limits.agency.total_visible_max`: 25
   - `profiles.limits.agency.independent_verification_required`: true

### Frontend

1. **Acceso administrativo**:
   - Ir a `/adminboard/config-manager`
   - Usar la pestaña "Límites de Agencias" para ajustar configuraciones
   - Usar la pestaña "Conversiones de Agencias" para gestionar solicitudes

## Uso del Sistema

### Para Usuarios

1. **Solicitar conversión a agencia**:
   - Ir a Configuración de Cuenta
   - Completar formulario de conversión
   - Esperar aprobación administrativa

2. **Beneficios como agencia**:
   - Límites extendidos de perfiles
   - Verificación independiente disponible
   - Gestión profesional de múltiples perfiles

### Para Administradores

1. **Gestionar conversiones**:
   - Acceder a `/adminboard/agency-conversions`
   - Revisar solicitudes pendientes
   - Aprobar o rechazar con razones específicas

2. **Configurar límites**:
   - Acceder a `/adminboard/config-manager`
   - Ajustar límites generales en "Límites de Perfiles"
   - Ajustar límites de agencias en "Límites de Agencias"

## Estructura de Archivos Modificados/Creados

### Backend
```
backend/src/
├── entities/User.ts                                    # Modelo actualizado
├── types/user.types.ts                                # Tipos actualizados
├── services/profile.service.ts                        # Lógica diferenciada
├── scripts/create-agency-profile-limits-config.ts     # Script de configuración
└── package.json                                       # Script agregado
```

### Frontend
```
frontend/src/
├── components/
│   ├── account/AgencyConversionForm.tsx              # Formulario de conversión
│   └── admin/
│       ├── ConfigManager/
│       │   ├── AgencyLimitsManager.tsx               # Gestor de límites
│       │   └── ConfigManager.tsx                     # Actualizado
│       └── AgencyConversionManager.tsx               # Gestor de conversiones
├── hooks/useAgencyConversion.ts                      # Hooks para conversiones
└── app/adminboard/agency-conversions/page.tsx        # Página administrativa
```

## API Endpoints

### Conversión de Agencias
- `POST /api/users/request-agency-conversion` - Solicitar conversión
- `GET /api/admin/agency-conversions` - Obtener conversiones
- `GET /api/admin/agency-conversions/stats` - Estadísticas
- `POST /api/admin/agency-conversions/:id/process` - Procesar solicitud

### Perfiles
- `GET /api/profiles/limits` - Obtener límites (diferenciados por tipo)
- `POST /api/profiles/validate-limits` - Validar límites antes de crear

## Configuración de Parámetros

### Límites Generales (usuarios comunes)
- `profiles.limits.free_profiles_max`
- `profiles.limits.paid_profiles_max`
- `profiles.limits.total_visible_max`

### Límites de Agencias
- `profiles.limits.agency.free_profiles_max`
- `profiles.limits.agency.paid_profiles_max`
- `profiles.limits.agency.total_visible_max`
- `profiles.limits.agency.independent_verification_required`

## Validaciones Implementadas

1. **Conversión a Agencia**:
   - Usuario debe estar autenticado
   - No puede tener conversión pendiente
   - Información de agencia requerida

2. **Creación de Perfiles**:
   - Verificación de límites según tipo de cuenta
   - Validación de estado de conversión para agencias
   - Verificación independiente para agencias (si está habilitada)

3. **Acceso Administrativo**:
   - Solo administradores pueden procesar conversiones
   - Razones requeridas para rechazos
   - Auditoría de cambios

## Consideraciones de Seguridad

- Las conversiones requieren aprobación administrativa
- Los límites se validan en el backend
- Estados de conversión auditados
- Verificación de permisos en todas las operaciones

## Próximos Pasos Recomendados

1. **Pruebas**:
   - Probar flujo completo de conversión
   - Validar límites diferenciados
   - Verificar interfaz administrativa

2. **Monitoreo**:
   - Implementar logs de conversiones
   - Métricas de uso por tipo de cuenta
   - Alertas para solicitudes pendientes

3. **Mejoras Futuras**:
   - Notificaciones automáticas
   - Renovación de estados de agencia
   - Límites dinámicos por plan de suscripción

## Soporte

Para problemas o preguntas sobre el sistema:
1. Verificar logs del servidor
2. Revisar configuración de parámetros
3. Validar permisos de usuario
4. Consultar documentación de API