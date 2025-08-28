import { z } from 'zod';

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

  // Step 3 - Detalles
  contact: z.object({
    number: z.string().optional(),
    whatsapp: z.boolean().optional(),
    telegram: z.boolean().optional(),
  }).optional(),
  age: z.string().optional(),
  skinColor: z.string().optional(),
  sexuality: z.string().optional(),
  eyeColor: z.string().optional(),
  hairColor: z.string().optional(),
  bodyType: z.string().optional(),
  height: z.string().optional(),
  // bustSize: z.string().optional(),
  rates: z.array(z.any()).optional(),
  availability: z.array(z.any()).optional(),

  // Step 4 - Multimedia
  photos: z.array(z.union([z.string(), z.instanceof(File)])).optional(),
  videos: z.array(z.union([z.string(), z.instanceof(File)])).optional(),
  audios: z.array(z.union([z.string(), z.instanceof(File)])).optional(),

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
  }).optional(),
});

export type FormData = z.infer<typeof formSchema>;