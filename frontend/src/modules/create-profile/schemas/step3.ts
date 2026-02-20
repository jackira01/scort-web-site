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
  }).refine(
    (data) => {
      // Al menos uno de los tres campos debe estar presente y no vacío
      const hasNumber = data.number && data.number.trim().length > 0;
      const hasWhatsapp = data.whatsapp && data.whatsapp.trim().length > 0;
      const hasTelegram = data.telegram && data.telegram.trim().length > 0;
      return hasNumber || hasWhatsapp || hasTelegram;
    },
    {
      message: 'Debes proporcionar al menos un método de contacto (número, WhatsApp o Telegram)',
    }
  ),

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
    .min(1, 'Debes seleccionar al menos un día disponible')
    .refine(
      (days) => {
        // Verificar que todos los días seleccionados tengan hora de inicio y fin
        return days.every((day) =>
          day.slots.length > 0 &&
          day.slots.every((slot) => slot.start && slot.end)
        );
      },
      {
        message: 'Debes seleccionar hora de inicio y fin para todos los días seleccionados',
      }
    ),
});

export type Step3FormData = z.infer<typeof step3Schema>;
