# Servicio de Correo con Mailjet

Este servicio proporciona funcionalidades para envío de correos individuales y masivos utilizando la API de Mailjet.

## Configuración

### Variables de Entorno Requeridas

Agrega las siguientes variables a tu archivo `.env`:

```env
# Mailjet Configuration
MJ_APIKEY_PUBLIC=tu_clave_publica_mailjet
MJ_APIKEY_PRIVATE=tu_clave_privada_mailjet

# Email Configuration
EMAIL_SENDER=noreply@tudominio.com
APP_NAME=Soporte App
```

### Obtener Credenciales de Mailjet

1. Regístrate en [Mailjet](https://www.mailjet.com/)
2. Ve a Account Settings > API Keys
3. Copia tu API Key y Secret Key
4. Configura las variables de entorno

## Uso del Servicio

### Importar el Servicio

```typescript
import emailService from '../services/email.service';
```

### Envío Individual

```typescript
const singleEmail = {
  to: {
    email: 'usuario@ejemplo.com',
    name: 'Nombre Usuario' // Opcional
  },
  content: {
    subject: 'Asunto del correo',
    textPart: 'Contenido en texto plano',
    htmlPart: '<h1>Contenido HTML</h1><p>Mensaje en HTML</p>'
  }
};

const result = await emailService.sendSingleEmail(singleEmail);
```

### Envío Masivo

```typescript
const bulkEmail = {
  to: [
    { email: 'usuario1@ejemplo.com', name: 'Usuario 1' },
    { email: 'usuario2@ejemplo.com', name: 'Usuario 2' },
    { email: 'usuario3@ejemplo.com' }
  ],
  content: {
    subject: 'Newsletter Mensual',
    textPart: 'Contenido del newsletter en texto',
    htmlPart: '<h1>Newsletter</h1><p>Contenido del newsletter</p>'
  }
};

const result = await emailService.sendBulkEmails(bulkEmail);
```

## Endpoints de la API

### POST /api/email/send
**Descripción:** Envía un correo individual  
**Autenticación:** Requerida  
**Cuerpo de la petición:**
```json
{
  "to": {
    "email": "usuario@ejemplo.com",
    "name": "Nombre Usuario"
  },
  "content": {
    "subject": "Asunto del correo",
    "textPart": "Contenido en texto plano",
    "htmlPart": "<h1>Contenido HTML</h1>"
  }
}
```

### POST /api/email/send-bulk
**Descripción:** Envía correos masivos  
**Autenticación:** Requerida (Admin)  
**Cuerpo de la petición:**
```json
{
  "to": [
    { "email": "usuario1@ejemplo.com", "name": "Usuario 1" },
    { "email": "usuario2@ejemplo.com", "name": "Usuario 2" }
  ],
  "content": {
    "subject": "Newsletter",
    "textPart": "Contenido en texto",
    "htmlPart": "<h1>Newsletter</h1>"
  }
}
```

### POST /api/email/test
**Descripción:** Prueba la configuración del servicio  
**Autenticación:** Requerida (Admin)  
**Cuerpo de la petición:**
```json
{
  "testEmail": "tu-email@ejemplo.com"
}
```

## Validaciones

El servicio incluye validaciones automáticas para:
- Formato de email válido
- Asunto requerido
- Contenido requerido (textPart o htmlPart)
- Al menos un destinatario

## Respuestas

### Envío Individual Exitoso
```json
{
  "success": true,
  "messageId": "123456789"
}
```

### Envío Masivo Exitoso
```json
{
  "success": true,
  "results": [
    {
      "email": "usuario1@ejemplo.com",
      "success": true,
      "messageId": "123456789"
    },
    {
      "email": "usuario2@ejemplo.com",
      "success": false,
      "error": "Invalid email format"
    }
  ],
  "totalSent": 1,
  "totalFailed": 1
}
```

### Error
```json
{
  "success": false,
  "error": "Descripción del error"
}
```

## Ejemplos de Uso en Controladores

```typescript
// Envío de correo de bienvenida
export const sendWelcomeEmail = async (userEmail: string, userName: string) => {
  const welcomeEmail = {
    to: { email: userEmail, name: userName },
    content: {
      subject: 'Bienvenido a Soporte App',
      htmlPart: `
        <h1>¡Bienvenido ${userName}!</h1>
        <p>Gracias por registrarte en nuestra plataforma.</p>
      `
    }
  };
  
  return await emailService.sendSingleEmail(welcomeEmail);
};

// Envío de newsletter
export const sendNewsletter = async (subscribers: Array<{email: string, name: string}>) => {
  const newsletter = {
    to: subscribers,
    content: {
      subject: 'Newsletter Semanal',
      htmlPart: `
        <h1>Newsletter Semanal</h1>
        <p>Contenido de la newsletter...</p>
      `
    }
  };
  
  return await emailService.sendBulkEmails(newsletter);
};
```

## Notas Importantes

- El envío masivo requiere permisos de administrador
- Mailjet tiene límites de envío según tu plan
- Se recomienda usar plantillas HTML responsivas
- Siempre incluir una versión en texto plano (textPart)
- Verificar que el dominio del EMAIL_SENDER esté configurado en Mailjet