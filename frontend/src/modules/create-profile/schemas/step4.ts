import { z } from 'zod';

// Schema para Step 4 - Multimedia
export const step4Schema = z.object({
  photos: z
    .array(z.union([z.string(), z.instanceof(File)]))
    .optional(),

  videos: z
    .array(z.union([z.string(), z.instanceof(File)]))
    .optional(),

  audios: z
    .array(z.union([z.string(), z.instanceof(File)]))
    .optional(),
});

export type Step4FormData = z.infer<typeof step4Schema>;