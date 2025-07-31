import { z } from 'zod';

// Schema para Step 3 - Detalles
export const step3Schema = z.object({
  phoneNumber: z.object({
    phone: z
      .string()
      .min(1, 'El número de teléfono es requerido')
      .regex(/^[+]?[0-9\s\-()]+$/, 'Formato de teléfono inválido'),
    whatsapp: z.boolean().optional(),
    telegram: z.boolean().optional(),
  }),
  
  age: z
    .string()
    .min(1, 'La edad es requerida')
    .refine((val) => {
      const num = parseInt(val);
      return num >= 18 && num <= 65;
    }, 'La edad debe estar entre 18 y 65 años'),
  
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
    .string()
    .min(1, 'La estatura es requerida'),
  
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