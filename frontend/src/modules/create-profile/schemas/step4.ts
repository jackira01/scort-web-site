import { z } from 'zod';

// Schema para Step 4 - Multimedia
export const step4Schema = z.object({
  photos: z
    .array(z.any())
    .optional(),
  
  videos: z
    .array(z.any())
    .optional(),
  
  audios: z
    .array(z.any())
    .optional(),
});

export type Step4FormData = z.infer<typeof step4Schema>;