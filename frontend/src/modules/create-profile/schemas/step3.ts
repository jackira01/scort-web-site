import { z } from 'zod';

// Schema para Step 3 - Detalles
export const step3Schema = z.object({
  contact: z.object({
    number: z
      .union([z.string(), z.undefined()])
      .superRefine((val, ctx) => {
        if (!val) return; // permitir undefined si es opcional

        if (!/^[0-9]+$/.test(val)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              'El número solo puede contener dígitos (0-9), sin espacios ni caracteres especiales',
          });
          return;
        }

        if (val.length !== 10) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'El número debe tener exactamente 10 dígitos',
          });
        }
      }),

    whatsapp: z
      .union([z.string(), z.undefined()])
      .superRefine((val, ctx) => {
        if (!val) return;

        if (!/^[0-9]+$/.test(val)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              'El número de WhatsApp solo puede contener dígitos (0-9), sin espacios ni caracteres especiales',
          });
          return;
        }

        if (val.length !== 10) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'El número de WhatsApp debe tener exactamente 10 dígitos',
          });
        }
      }),

    telegram: z
      .union([z.string(), z.undefined()])
      .superRefine((val, ctx) => {
        if (!val) return;

        if (!/^[0-9]+$/.test(val)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              'El número de Telegram solo puede contener dígitos (0-9), sin espacios ni caracteres especiales',
          });
          return;
        }

        if (val.length !== 10) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              'El número de Telegram debe tener exactamente 10 dígitos',
          });
        }
      }),
  }),

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

  skinColor: z.string().min(1, 'Debes seleccionar el color de piel'),

  eyeColor: z.string().min(1, 'Debes seleccionar el color de ojos'),

  hairColor: z.string().min(1, 'Debes seleccionar el color de cabello'),

  bodyType: z.string().min(1, 'Debes seleccionar el tipo de cuerpo'),

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

  socialMedia: z
    .object({
      instagram: z.string().optional(),
      facebook: z.string().optional(),
      tiktok: z.string().optional(),
      twitter: z.string().optional(),
      onlyFans: z.string().optional(),
    })
    .optional(),

  rates: z
    .array(
      z.object({
        id: z.string(),
        time: z.string().min(1, 'La duración es requerida'),
        price: z.number().min(1, 'El precio debe ser mayor a 0'),
        delivery: z.boolean(),
      }),
    )
    .min(1, 'Debes agregar al menos una tarifa'),

  availability: z
    .array(
      z.object({
        dayOfWeek: z.string(),
        slots: z.array(
          z.object({
            start: z.string(),
            end: z.string(),
            timezone: z.string(),
          }),
        ),
      }),
    )
    .min(1, 'Debes seleccionar al menos un día disponible'),
});

export type Step3FormData = z.infer<typeof step3Schema>;
