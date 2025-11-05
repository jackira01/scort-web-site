"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listContentPagesValidation = exports.slugParamValidation = exports.updateContentPageValidation = exports.createContentPageValidation = void 0;
const zod_1 = require("zod");
const content_types_1 = require("./content.types");
const faqItemSchema = zod_1.z.object({
    question: zod_1.z.string().trim().min(1, 'La pregunta no puede estar vacía')
        .max(500, 'La pregunta no puede exceder 500 caracteres'),
    answer: zod_1.z.string().trim().min(1, 'La respuesta no puede estar vacía')
        .max(2000, 'La respuesta no puede exceder 2000 caracteres')
});
const contentBlockSchema = zod_1.z.object({
    type: zod_1.z.nativeEnum(content_types_1.ContentBlockType, {
        errorMap: () => ({ message: 'El tipo de bloque debe ser uno de: paragraph, list, image, link, faq' })
    }),
    value: zod_1.z.union([
        zod_1.z.string().trim().min(1, 'El contenido del bloque no puede estar vacío')
            .max(5000, 'El contenido del bloque no puede exceder 5000 caracteres'),
        zod_1.z.array(zod_1.z.string().trim().min(1, 'Cada elemento de la lista debe tener al menos 1 carácter')
            .max(500, 'Cada elemento de la lista no puede exceder 500 caracteres'))
            .min(1, 'La lista debe tener al menos un elemento')
            .max(20, 'La lista no puede tener más de 20 elementos'),
        zod_1.z.array(faqItemSchema)
            .min(1, 'El bloque FAQ debe tener al menos una pregunta')
            .max(50, 'El bloque FAQ no puede tener más de 50 preguntas')
    ]),
    order: zod_1.z.number().int().min(0, 'El orden debe ser un número positivo')
        .max(999, 'El orden no puede exceder 999').default(0)
}).refine((data) => {
    if (data.type === content_types_1.ContentBlockType.LIST) {
        return Array.isArray(data.value) && data.value.every((item) => typeof item === 'string');
    }
    if (data.type === content_types_1.ContentBlockType.FAQ) {
        return Array.isArray(data.value) && data.value.every((item) => typeof item === 'object' && 'question' in item && 'answer' in item);
    }
    return typeof data.value === 'string';
}, {
    message: 'El tipo de valor debe coincidir con el tipo de bloque',
    path: ['value']
});
const contentSectionSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(1, 'El título de la sección no puede estar vacío')
        .max(200, 'El título de la sección no puede exceder 200 caracteres'),
    order: zod_1.z.number().int().min(0, 'El orden debe ser un número positivo')
        .max(999, 'El orden no puede exceder 999'),
    blocks: zod_1.z.array(contentBlockSchema)
        .min(1, 'La sección debe tener al menos un bloque')
        .max(100, 'La sección no puede tener más de 100 bloques')
});
exports.createContentPageValidation = zod_1.z.object({
    slug: zod_1.z.string().trim().toLowerCase().min(2, 'El slug debe tener al menos 2 caracteres')
        .max(50, 'El slug no puede exceder 50 caracteres')
        .regex(/^[a-z0-9-_]+$/, 'El slug solo puede contener letras minúsculas, números, guiones y guiones bajos'),
    title: zod_1.z.string().trim().min(1, 'El título no puede estar vacío')
        .max(200, 'El título no puede exceder 200 caracteres'),
    sections: zod_1.z.array(contentSectionSchema)
        .min(1, 'La página debe tener al menos una sección')
        .max(20, 'La página no puede tener más de 20 secciones'),
    modifiedBy: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'El ID del usuario debe ser un ObjectId válido'),
    isActive: zod_1.z.boolean().default(true)
});
exports.updateContentPageValidation = zod_1.z.object({
    title: zod_1.z.string().trim().min(1, 'El título no puede estar vacío')
        .max(200, 'El título no puede exceder 200 caracteres').optional(),
    sections: zod_1.z.array(contentSectionSchema)
        .min(1, 'La página debe tener al menos una sección')
        .max(20, 'La página no puede tener más de 20 secciones').optional(),
    modifiedBy: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'El ID del usuario debe ser un ObjectId válido').optional(),
    isActive: zod_1.z.boolean().optional()
}).refine((data) => {
    const { modifiedBy, ...rest } = data;
    return Object.keys(rest).length > 0;
}, {
    message: 'Debe proporcionar al menos un campo para actualizar'
});
exports.slugParamValidation = zod_1.z.object({
    slug: zod_1.z.string().trim().toLowerCase().min(2, 'El slug debe tener al menos 2 caracteres')
        .max(50, 'El slug no puede exceder 50 caracteres')
        .regex(/^[a-z0-9-_]+$/, 'El slug solo puede contener letras minúsculas, números, guiones y guiones bajos')
});
exports.listContentPagesValidation = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1, 'La página debe ser mayor a 0').default(1),
    limit: zod_1.z.coerce.number().int().min(1, 'El límite debe ser mayor a 0')
        .max(100, 'El límite no puede exceder 100').default(10),
    isActive: zod_1.z.coerce.boolean().optional(),
    search: zod_1.z.string().trim().min(1, 'El término de búsqueda debe tener al menos 1 carácter')
        .max(100, 'El término de búsqueda no puede exceder 100 caracteres').optional()
});
