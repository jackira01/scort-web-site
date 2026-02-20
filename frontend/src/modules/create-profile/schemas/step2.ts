import { z } from 'zod';

// Schema para Step 2 - Descripción
export const step2Schema = z.object({
  description: z
    .string()
    .min(1, 'La descripción es requerida')
    .min(50, 'La descripción debe tener al menos 50 caracteres')
    .max(600, 'La descripción no puede exceder 600 caracteres'),

  age: z
    .string({
      required_error: 'La edad es requerida',
      invalid_type_error: 'La edad debe ser un número válido',
    })
    .min(1, 'La edad es requerida')
    .regex(/^\d+$/, 'La edad debe ser un número válido')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 18, {
      message: 'La edad debe ser al menos 18 años',
    })
    .refine((val) => val <= 100, {
      message: 'La edad no puede ser mayor a 100 años',
    }),

  height: z
    .union([
      z.number(),
      z
        .string()
        .regex(/^\d+(\.\d+)?$/, 'Debes ingresar un número sin comas(,) o puntos(.)'),
    ])
    .transform((val) => {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      if (isNaN(num)) {
        throw new Error('Debes ingresar un número sin comas(,) o puntos(.)');
      }
      return num;
    })
    .refine((val) => val >= 40 && val <= 300, 'La altura debe estar entre 40 y 300 cm'),

  skinColor: z.string().min(1, 'Debes seleccionar el color de piel'),

  eyeColor: z.string().min(1, 'Debes seleccionar el color de ojos'),

  hairColor: z.string().min(1, 'Debes seleccionar el color de cabello'),

  bodyType: z.string().min(1, 'Debes seleccionar el tipo de cuerpo'),

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