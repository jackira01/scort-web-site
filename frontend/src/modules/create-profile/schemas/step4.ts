import { z } from 'zod';

// Schema para Step 4 - Multimedia
export const step4Schema = z.object(/* {
  photos: z
    .array(z.any())
    .min(3, 'Debes subir al menos 3 fotos')
    .max(10, 'No puedes subir más de 10 fotos'),
  
  videos: z
    .array(z.any())
    .optional(),
  
  audios: z
    .array(z.any())
    .optional(),
} */);

export type Step4FormData = z.infer<typeof step4Schema>;