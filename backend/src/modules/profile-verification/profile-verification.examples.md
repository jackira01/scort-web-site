# Profile Verification API Examples

## Sistema de Progreso de Verificación

El sistema calcula automáticamente el progreso de verificación basado en 10 pasos diferentes, cada uno vale 10 puntos porcentuales:

1. **Fotos de documentos** - Verificar que se hayan subido documentos
2. **Selfie con póster** - Verificar que se haya subido selfie con póster
3. **Selfie con documento** - Verificar que se haya subido selfie con documento
4. **Fotos de cuerpo completo** - Verificar que se hayan subido al menos 2 fotos
5. **Vídeo** - Verificar que se haya subido un vídeo
6. **Solicitud de videollamada** - Verificar que se haya solicitado videollamada
7. **Redes sociales** - Verificar que se haya vinculado al menos 1 cuenta
8. **Detección de cambio de teléfono** - Verificar que no haya cambiado en 30 días
9. **Last Login** - Verificar que el usuario haya hecho login en los últimos 30 días
10. **Verificación general del usuario** - Verificar que el usuario esté verificado

**Nota:** El progreso se recalcula automáticamente cuando se actualizan los pasos de verificación.

## Endpoints Disponibles

### 1. Obtener verificación por ID de perfil
```http
GET /api/profile-verification/profile/:profileId
```

**Ejemplo de respuesta:**
```json
{
  "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
  "profile": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
    "name": "María García",
    "user": "64f1a2b3c4d5e6f7g8h9i0j3"
  },
  "verificationStatus": "pending",
  "documentPhotos": {
    "documents": ["doc1.jpg", "doc2.jpg"],
    "isVerified": false
  },
  "selfieWithDoc": {
    "photo": "selfie.jpg",
    "isVerified": false
  },
  "facePhotos": true,
  "fullBodyPhotos": true,
  "video": "verification_video.mp4",
  "socialMedia": true,
  "createdAt": "2023-09-01T10:00:00.000Z",
  "updatedAt": "2023-09-01T10:00:00.000Z"
}
```

### 2. Obtener verificación por ID
```http
GET /api/profile-verification/:id
```

### 3. Crear nueva verificación
```http
POST /api/profile-verification
```

**Ejemplo de body:**
```json
{
  "profile": "64f1a2b3c4d5e6f7g8h9i0j2",
  "documentPhotos": {
    "documents": ["documento1.jpg", "documento2.jpg"],
    "isVerified": false
  },
  "selfieWithDoc": {
    "photo": "selfie_con_documento.jpg",
    "isVerified": false
  },
  "facePhotos": true,
  "fullBodyPhotos": true,
  "video": "video_verificacion.mp4",
  "videoCallRequested": {
    "videoLink": "https://meet.google.com/abc-def-ghi",
    "isVerified": false
  },
  "socialMedia": true,
  "phoneChangeDetected": false
}
```

### 4. Actualizar verificación
```http
PUT /api/profile-verification/:id
```

**Ejemplo de body:**
```json
{
  "verificationStatus": "verified",
  "documentPhotos": {
    "isVerified": true
  },
  "selfieWithDoc": {
    "isVerified": true
  },
  "verifiedAt": "2023-09-01T15:30:00.000Z"
}
```

### 5. Actualizar solo el estado de verificación
```http
PATCH /api/profile-verification/:id/status
```

**Ejemplo de body:**
```json
{
  "status": "rejected",
  "reason": "Documentos no legibles"
}
```

### 6. Eliminar verificación
```http
DELETE /api/profile-verification/:id
```

### 7. Obtener todas las verificaciones con filtros
```http
GET /api/profile-verification?status=pending&page=1&limit=10
```

**Parámetros de consulta:**
- `status`: 'pending' | 'verified' | 'rejected'
- `page`: número de página (default: 1)
- `limit`: elementos por página (default: 10)

**Ejemplo de respuesta:**
```json
{
  "verifications": [
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "profile": {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
        "name": "María García",
        "user": "64f1a2b3c4d5e6f7g8h9i0j3"
      },
      "verificationStatus": "pending",
      "createdAt": "2023-09-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

## Estados de Verificación

- **pending**: Verificación pendiente de revisión
- **verified**: Verificación aprobada
- **rejected**: Verificación rechazada

## Campos Requeridos para Verificación Completa

1. **documentPhotos**: Fotos de documentos de identidad
2. **selfieWithDoc**: Selfie sosteniendo el documento
3. **facePhotos**: Al menos 2 fotos de rostro
4. **fullBodyPhotos**: Al menos 2 fotos de cuerpo completo
5. **video**: Video de verificación
6. **socialMedia**: Al menos una cuenta de redes sociales
7. **videoCallRequested**: Videollamada de verificación (opcional)

### 8. Actualizar pasos específicos de verificación
```http
PATCH /api/profile-verification/:id/steps
```

**Ejemplo de body:**
```json
{
  "documentPhotos": {
    "documents": ["doc1.jpg", "doc2.jpg"],
    "isVerified": true
  },
  "selfieWithDoc": {
    "photo": "selfie_with_doc.jpg",
    "isVerified": true
  },
  "fullBodyPhotos": {
    "photos": ["body1.jpg", "body2.jpg"],
    "isVerified": false
  }
}
```

**Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "profile": "64f1a2b3c4d5e6f7g8h9i0j2",
    "verificationStatus": "pending",
    "verificationProgress": 30,
    "steps": {
      "documentPhotos": {
        "documents": ["doc1.jpg", "doc2.jpg"],
        "isVerified": true
      },
      "selfieWithDoc": {
        "photo": "selfie_with_doc.jpg",
        "isVerified": true
      },
      "fullBodyPhotos": {
        "photos": ["body1.jpg", "body2.jpg"],
        "isVerified": false
      }
    }
  },
  "message": "Pasos de verificación actualizados y progreso recalculado exitosamente"
}
```

### 9. Recalcular progreso de verificación
```http
POST /api/profile-verification/:id/recalculate
```

**Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "verificationProgress": 50,
    "steps": {
      // ... todos los pasos actualizados
    }
  },
  "message": "Progreso de verificación recalculado exitosamente"
}
```

## Códigos de Respuesta

- **200**: Operación exitosa
- **201**: Verificación creada exitosamente
- **400**: Datos inválidos
- **404**: Verificación no encontrada
- **500**: Error interno del servidor