import { z } from 'zod';

// Schema para Step 2 - Descripción
export const step2Schema = z.object({
  description: z
    .string()
    .min(1, 'La descripción es requerida')
    .min(50, 'La descripción debe tener al menos 50 caracteres')
    .max(600, 'La descripción no puede exceder 600 caracteres'),

  selectedServices: z
    .array(z.string())
    .min(1, 'Debes seleccionar al menos un servicio'),

  basicServices: z
    .array(z.string())
    .optional()
    .default([]),

  additionalServices: z
    .array(z.string())
    .optional()
    .default([]),
});

export type Step2FormData = z.infer<typeof step2Schema>;