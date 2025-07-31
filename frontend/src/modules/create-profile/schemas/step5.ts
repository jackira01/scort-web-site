import { z } from 'zod';

// Schema para Step 5 - Finalizar
export const step5Schema = z.object({
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, 'Debes aceptar los términos y condiciones'),
  
  selectedUpgrades: z
    .array(z.string())
    .optional(),
});

export type Step5FormData = z.infer<typeof step5Schema>;