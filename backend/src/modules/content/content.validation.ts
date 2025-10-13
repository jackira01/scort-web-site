import { z } from 'zod';
import { ContentBlockType } from './content.types';

// Tipos derivados de Zod para asegurar compatibilidad
export type ZodContentBlock = z.infer<typeof contentBlockSchema>;
export type ZodContentSection = z.infer<typeof contentSectionSchema>;
export type ZodCreateContentPageInput = z.infer<typeof createContentPageValidation>;
export type ZodUpdateContentPageInput = z.infer<typeof updateContentPageValidation>;

/**
 * Validación para bloques de contenido
 */
const contentBlockSchema = z.object({
  type: z.nativeEnum(ContentBlockType, {
    errorMap: () => ({ message: 'El tipo de bloque debe ser uno de: paragraph, list, image, link' })
  }),
  
  value: z.union([
    z.string().trim().min(1, 'El contenido del bloque no puede estar vacío')
      .max(5000, 'El contenido del bloque no puede exceder 5000 caracteres'),
    z.array(z.string().trim().min(1, 'Cada elemento de la lista debe tener al menos 1 carácter')
      .max(500, 'Cada elemento de la lista no puede exceder 500 caracteres'))
      .min(1, 'La lista debe tener al menos un elemento')
      .max(20, 'La lista no puede tener más de 20 elementos')
  ]),
  
  order: z.number().int().min(0, 'El orden debe ser un número positivo')
    .max(999, 'El orden no puede exceder 999').default(0)
}).refine((data) => {
  // Validación condicional: si el tipo es LIST, el valor debe ser un array
  if (data.type === ContentBlockType.LIST) {
    return Array.isArray(data.value);
  }
  // Para otros tipos, el valor debe ser string
  return typeof data.value === 'string';
}, {
  message: 'El tipo de valor debe coincidir con el tipo de bloque',
  path: ['value']
});

/**
 * Validación para secciones de contenido
 */
const contentSectionSchema = z.object({
  title: z.string().trim().min(1, 'El título de la sección no puede estar vacío')
    .max(200, 'El título de la sección no puede exceder 200 caracteres'),
  
  order: z.number().int().min(0, 'El orden debe ser un número positivo')
    .max(999, 'El orden no puede exceder 999'),
  
  blocks: z.array(contentBlockSchema)
    .min(1, 'La sección debe tener al menos un bloque')
    .max(100, 'La sección no puede tener más de 100 bloques')
});

/**
 * Validación para crear una página de contenido
 */
export const createContentPageValidation = z.object({
  slug: z.string().trim().toLowerCase().min(2, 'El slug debe tener al menos 2 caracteres')
    .max(50, 'El slug no puede exceder 50 caracteres')
    .regex(/^[a-z0-9-_]+$/, 'El slug solo puede contener letras minúsculas, números, guiones y guiones bajos'),
  
  title: z.string().trim().min(1, 'El título no puede estar vacío')
    .max(200, 'El título no puede exceder 200 caracteres'),
  
  sections: z.array(contentSectionSchema)
    .min(1, 'La página debe tener al menos una sección')
    .max(20, 'La página no puede tener más de 20 secciones'),
  
  modifiedBy: z.string().regex(/^[0-9a-fA-F]{24}$/, 'El ID del usuario debe ser un ObjectId válido'),
  
  isActive: z.boolean().default(true)
});

/**
 * Validación para actualizar una página de contenido
 */
export const updateContentPageValidation = z.object({
  title: z.string().trim().min(1, 'El título no puede estar vacío')
    .max(200, 'El título no puede exceder 200 caracteres').optional(),
  
  sections: z.array(contentSectionSchema)
    .min(1, 'La página debe tener al menos una sección')
    .max(20, 'La página no puede tener más de 20 secciones').optional(),
  
  modifiedBy: z.string().regex(/^[0-9a-fA-F]{24}$/, 'El ID del usuario debe ser un ObjectId válido').optional(),
  
  isActive: z.boolean().optional()
}).refine((data) => {
  const { modifiedBy, ...rest } = data;
  return Object.keys(rest).length > 0;
}, {
  message: 'Debe proporcionar al menos un campo para actualizar'
});

/**
 * Validación para parámetros de ruta
 */
export const slugParamValidation = z.object({
  slug: z.string().trim().toLowerCase().min(2, 'El slug debe tener al menos 2 caracteres')
    .max(50, 'El slug no puede exceder 50 caracteres')
    .regex(/^[a-z0-9-_]+$/, 'El slug solo puede contener letras minúsculas, números, guiones y guiones bajos')
});

/**
 * Validación para query parameters de listado
 */
export const listContentPagesValidation = z.object({
  page: z.coerce.number().int().min(1, 'La página debe ser mayor a 0').default(1),
  
  limit: z.coerce.number().int().min(1, 'El límite debe ser mayor a 0')
    .max(100, 'El límite no puede exceder 100').default(10),
  
  isActive: z.coerce.boolean().optional(),
  
  search: z.string().trim().min(1, 'El término de búsqueda debe tener al menos 1 carácter')
    .max(100, 'El término de búsqueda no puede exceder 100 caracteres').optional()
});