import { z } from 'zod';
import { ProcessedImageResult } from '@/utils/imageProcessor';

// Re-export step1Schema for backward compatibility
export { step1Schema, type Step1FormData } from './step1';

// Schema completo del formulario (para uso futuro)
export const formSchema = z.object({
  // Step 1 - Lo esencial
  profileName: z.string().min(1, 'El nombre del perfil es requerido'),
  gender: z.string().min(1, 'Debes seleccionar un género'),
  // workType: z.string().optional(),
  category: z.string().min(1, 'Debes seleccionar una categoría'),
  location: z.object({
    country: z.string().min(1, 'El país es requerido'),
    department: z.string().min(1, 'El departamento es requerido'),
    city: z.string().min(1, 'La ciudad es requerida'),
  }),

  // Step 2 - Descripción
  description: z.string().optional(),
  selectedServices: z.array(z.string()).optional(),
  basicServices: z.array(z.string()).optional(),
  additionalServices: z.array(z.string()).optional(),

  // Step 3 - Detalles
  contact: z.object({
    number: z
      .string()
      .min(1, 'El número de teléfono es requerido')
      .regex(/^[0-9]{10}$/, 'El número debe tener exactamente 10 dígitos'),
    whatsapp: z
      .string()
      .optional()
      .refine((val) => !val || /^[0-9]{10}$/.test(val), {
        message: 'WhatsApp debe tener exactamente 10 dígitos'
      }),
    telegram: z
      .string()
      .optional()
      .refine((val) => !val || /^[0-9]{10}$/.test(val), {
        message: 'Telegram debe tener exactamente 10 dígitos'
      }),
  }),
  age: z.string().optional(),
  skinColor: z.string().optional(),
  sexuality: z.string().optional(),
  eyeColor: z.string().optional(),
  hairColor: z.string().optional(),
  bodyType: z.string().optional(),
  height: z.string().optional(),
  socialMedia: z.object({
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    tiktok: z.string().optional(),
    twitter: z.string().optional(),
    onlyFans: z.string().optional(),
  }).optional(),
  // bustSize: z.string().optional(),
  rates: z.array(z.any()).optional(),
  availability: z.array(z.any()).optional(),

  // Step 4 - Multimedia
  photos: z.array(z.union([z.string(), z.instanceof(File)])).optional(),
  videos: z.array(z.union([z.string(), z.instanceof(File), z.null()])).optional(),
  audios: z.array(z.union([z.string(), z.instanceof(File)])).optional(),
  processedImages: z.array(z.any()).optional(), // Array de ProcessedImageResult
  coverImageIndex: z.number().optional(), // Índice de la imagen de portada seleccionada
  videoCoverImages: z.record(z.number(), z.union([z.string(), z.instanceof(File)])).optional(), // Imágenes de portada para videos

  // Step 5 - Finalizar
  selectedUpgrades: z.array(z.string()).optional(),
  acceptTerms: z.boolean().optional(),

  // Step 5 - Selección de Plan (integrado en finalizar)
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
  }).optional(),
  selectedVariant: z.object({
    price: z.number(),
    days: z.number(),
    durationRank: z.number()
  }).optional(),
});

export type FormData = z.infer<typeof formSchema>;