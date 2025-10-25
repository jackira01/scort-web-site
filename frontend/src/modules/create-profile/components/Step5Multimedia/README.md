# Step5Multimedia - Estructura Modular

Esta carpeta contiene el componente Step5Multimedia refactorizado en una estructura modular para mejor mantenibilidad y escalabilidad.

## 📁 Estructura de Carpetas

```
Step5Multimedia/
├── components/          # Componentes reutilizables
│   ├── FileUploadZone.tsx
│   ├── LimitAlert.tsx
│   ├── FilesCounterBadge.tsx
│   ├── InfoMessage.tsx
│   └── index.ts
├── hooks/              # Custom hooks
│   ├── useContentLimits.ts
│   ├── useImageProcessing.ts
│   ├── useFileHandlers.ts
│   └── index.ts
├── types/              # Interfaces y tipos TypeScript
│   └── index.ts
├── utils/              # Funciones de utilidad
│   └── fileValidation.ts
├── Step5Multimedia.tsx # Componente principal
└── index.ts           # Punto de entrada

```

## 🎯 Responsabilidades

### Components (`components/`)
- **FileUploadZone**: Zona de carga de archivos con drag & drop visual
- **LimitAlert**: Alerta cuando se alcanza el límite del plan
- **FilesCounterBadge**: Badge que muestra contador actual/máximo
- **InfoMessage**: Mensajes informativos, warnings y errores

### Hooks (`hooks/`)
- **useContentLimits**: Maneja los límites de contenido según el plan
- **useImageProcessing**: Procesa imágenes (compresión, watermark, crop)
- **useFileHandlers**: Maneja selección y eliminación de archivos

### Types (`types/`)
- Interfaces para ContentLimits, DefaultPlanConfig
- Tipos FileType, ImageToCrop, VideoCoverToCrop
- Configuración de validación de archivos

### Utils (`utils/`)
- **fileValidation**: Valida tipos, tamaños y límites de archivos
- **extractFilesFromList**: Extrae archivos de FileList con fallbacks

## 🚀 Uso

```tsx
import { Step5Multimedia } from '@/modules/create-profile/components/Step5Multimedia';

// En tu formulario
<Step5Multimedia />
```

## 🔧 Mantenimiento

### Agregar nuevo tipo de archivo
1. Actualizar `FileType` en `types/index.ts`
2. Agregar validación en `utils/fileValidation.ts`
3. Actualizar `handleFileSelect` en `hooks/useFileHandlers.ts`

### Modificar límites por defecto
Editar valores iniciales en `hooks/useContentLimits.ts`

### Agregar nuevo componente UI
1. Crear en `components/`
2. Exportar en `components/index.ts`
3. Importar en `Step5Multimedia.tsx`

## 📝 Notas

- Todas las validaciones están centralizadas en `utils/fileValidation.ts`
- El procesamiento de imágenes usa `@/utils/imageProcessor` (global)
- Los modals de crop se mantienen en el componente principal por complejidad
