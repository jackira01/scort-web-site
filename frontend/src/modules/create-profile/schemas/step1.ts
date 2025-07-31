import { z } from 'zod';

// Schema para Step 1 - Información Esencial
export const step1Schema = z.object({
  profileName: z
    .string()
    .min(1, 'El nombre del perfil es requerido')
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  
  gender: z
    .string()
    .min(1, 'Debes seleccionar un género'),
  
  category: z
    .string()
    .min(1, 'Debes seleccionar una categoría'),
  
  location: z.object({
    country: z.string().min(1, 'El país es requerido'),
    state: z.string().min(1, 'El departamento es requerido'),
    city: z.string().min(1, 'La ciudad es requerida'),
  }),
});

export type Step1FormData = z.infer<typeof step1Schema>;