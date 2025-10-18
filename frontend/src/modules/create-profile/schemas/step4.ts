import { z } from 'zod';

// Schema para Step 4 - Selección de Plan
export const step4Schema = z.object({
  selectedUpgrades: z.array(z.string()).optional(),
  selectedPlan: z.object({
    _id: z.string(),
    name: z.string(),
    code: z.string(),
    variants: z.array(z.object({
      price: z.number(),
      days: z.number(),
      durationRank: z.number()
    })),
    contentLimits: z.object({
      photos: z.object({
        min: z.number(),
        max: z.number()
      }),
      videos: z.object({
        min: z.number(),
        max: z.number()
      }),
      audios: z.object({
        min: z.number(),
        max: z.number()
      }),
      storiesPerDayMax: z.number()
    })
  }).refine((val) => val !== undefined, {
    message: 'Debes seleccionar un plan',
  }),
  selectedVariant: z.object({
    price: z.number(),
    days: z.number(),
    durationRank: z.number()
  }).refine((val) => val !== undefined, {
    message: 'Debes seleccionar una variante del plan',
  }),
});

export type Step4FormData = z.infer<typeof step4Schema>;