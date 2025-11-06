import { z } from 'zod';

export const step5Schema = z.object({
  // photos puede ser array de strings (URLs) o Files
  photos: z.array(z.union([z.string(), z.instanceof(File)])).min(1, {
    message: 'Debes subir al menos una foto para crear tu perfil',
  }),
  videos: z.array(z.any()).optional(),
  audios: z.array(z.any()).optional(),

  // ✅ AGREGAR ESTOS CAMPOS CRÍTICOS
  coverImageIndex: z.number().optional().default(0),
  processedImages: z.array(z.any()).optional(),
  videoCoverImages: z.record(z.union([z.string(), z.instanceof(File)])).optional(),

  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'Debes aceptar los términos y condiciones',
  }),
});

export type Step5FormData = z.infer<typeof step5Schema>;