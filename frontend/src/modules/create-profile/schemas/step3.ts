import { z } from 'zod';

// Schema para Step 3 - Detalles
export const step3Schema = z.object({
  contact: z.object({
    number: z
      .string()
      .min(1, 'El número de teléfono es requerido')
      .regex(/^[+]?[0-9\s\-()]+$/, 'Formato de teléfono inválido'),
    whatsapp: z.boolean().optional(),
    telegram: z.boolean().optional(),
  }),
  
  age: z
    .union([
      z.number(),
      z.string().regex(/^\d+$/, 'debe ser un número válido')
    ])
    .transform((val) => {
      const num = typeof val === 'string' ? parseInt(val, 10) : val;
      if (isNaN(num)) {
        throw new Error('debe ser un número válido');
      }
      return num;
    })
    .refine((val) => val >= 18 && val <= 100, 'La edad debe estar entre 18 y 100 años'),
  
  skinColor: z
    .string()
    .min(1, 'Debes seleccionar el color de piel'),
  
  sexuality: z
    .string()
    .min(1, 'Debes seleccionar la orientación sexual'),
  
  eyeColor: z
    .string()
    .min(1, 'Debes seleccionar el color de ojos'),
  
  hairColor: z
    .string()
    .min(1, 'Debes seleccionar el color de cabello'),
  
  bodyType: z
    .string()
    .min(1, 'Debes seleccionar el tipo de cuerpo'),
  
  height: z
    .union([
      z.number(),
      z.string().regex(/^\d+(\.\d+)?$/, 'debe ser un número válido')
    ])
    .transform((val) => {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      if (isNaN(num)) {
        throw new Error('debe ser un número válido');
      }
      return num;
    })
    .refine((val) => val >= 40 && val <= 300, 'La altura debe estar entre 40 y 300 cm'),
  
  /* bustSize: z
    .string()
    .min(1, 'Debes seleccionar el tamaño del busto'), */
  
  rates: z
    .array(z.object({
      id: z.string(),
      time: z.string().min(1, 'La duración es requerida'),
      price: z.number().min(1, 'El precio debe ser mayor a 0'),
      delivery: z.boolean(),
    }))
    .min(1, 'Debes agregar al menos una tarifa'),
    
  availability: z
    .array(z.object({
      dayOfWeek: z.string(),
      slots: z.array(z.object({
        start: z.string(),
        end: z.string(),
        timezone: z.string(),
      })),
    }))
    .min(1, 'Debes seleccionar al menos un día disponible'),
});

export type Step3FormData = z.infer<typeof step3Schema>;