import { z } from 'zod';

export const step5Schema = z.object({
  selectedUpgrades: z.array(z.string()).optional(),
  selectedPlan: z.object({
    id: z.string(),
    name: z.string(),
    code: z.string(),
    level: z.number(),
  }).optional().refine((val) => val !== undefined, {
    message: 'Debes seleccionar un plan',
  }),
  selectedVariant: z.object({
    id: z.string(),
    days: z.number(),
    price: z.number(),
  }).optional(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'Debes aceptar los términos y condiciones',
  }),
});

export type Step5FormData = z.infer<typeof step5Schema>;