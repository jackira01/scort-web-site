import { z } from 'zod';

// Schema para Step 5 - Finalizar
export const step5Schema = z.object({
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, 'Debes aceptar los términos y condiciones'),
  
  selectedUpgrades: z
    .array(z.string())
    .optional(),

  // Selección de Plan
  selectedPlan: z.object({
    _id: z.string().min(1, 'Debe seleccionar un plan'),
    name: z.string(),
    code: z.string(),
    variants: z.array(z.object({
      price: z.number(),
      days: z.number(),
      durationRank: z.number()
    })),
    contentLimits: z.object({
      maxPhotos: z.number(),
      maxVideos: z.number(),
      maxAudios: z.number(),
      maxProfiles: z.number()
    })
  }).optional(),
  selectedVariant: z.object({
    price: z.number(),
    days: z.number(),
    durationRank: z.number()
  }).optional()
});

export type Step5FormData = z.infer<typeof step5Schema>;