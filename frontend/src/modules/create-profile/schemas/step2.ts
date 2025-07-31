import { z } from 'zod';

// Schema para Step 2 - Descripción
export const step2Schema = z.object({
  description: z
    .string()
    .min(1, 'La descripción es requerida')
    .min(50, 'La descripción debe tener al menos 50 caracteres')
    .max(1000, 'La descripción no puede exceder 1000 caracteres'),
  
  selectedServices: z
    .array(z.string())
    .min(1, 'Debes seleccionar al menos un servicio'),
});

export type Step2FormData = z.infer<typeof step2Schema>;