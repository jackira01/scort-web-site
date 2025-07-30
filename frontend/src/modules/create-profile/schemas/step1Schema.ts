import { z } from 'zod';

// Esquema de validación para el Step 1 usando Zod v4
export const step1Schema = z.object({
  profileName: z
    .string()
    .min(5, { message: 'El nombre del perfil debe tener al menos 5 caracteres' })
    .max(50, { message: 'El nombre del perfil no puede exceder los 50 caracteres' }),
  gender: z.string().min(1, { message: 'Debes seleccionar un género' }),
  category: z.string().min(1, { message: 'Debes seleccionar una categoría' }),
  location: z.object({
    country: z.string().default('Colombia'),
    state: z.string().min(1, { message: 'Debes seleccionar un departamento' }),
    city: z.string().min(1, { message: 'Debes seleccionar una ciudad' }),
  }),
});

// Tipo inferido del esquema para usar con TypeScript
export type Step1FormValues = z.infer<typeof step1Schema>;