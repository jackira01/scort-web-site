"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentService = void 0;
const content_model_1 = require("./content.model");
const mongoose_1 = __importDefault(require("mongoose"));
class ContentService {
    static async getAllPages(page = 1, limit = 10, isActive, search) {
        try {
            const skip = (page - 1) * limit;
            const filters = {};
            if (isActive !== undefined) {
                filters.isActive = isActive;
            }
            if (search) {
                filters.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { slug: { $regex: search, $options: 'i' } }
                ];
            }
            const [pages, total] = await Promise.all([
                content_model_1.ContentPageModel
                    .find(filters)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                content_model_1.ContentPageModel.countDocuments(filters)
            ]);
            return {
                success: true,
                data: pages,
                total
            };
        }
        catch (error) {
            console.error('Error al obtener páginas:', error);
            return {
                success: false,
                message: 'Error interno del servidor al obtener las páginas'
            };
        }
    }
    static async getPageBySlug(slug) {
        try {
            const page = await content_model_1.ContentPageModel
                .findOne({ slug, isActive: true })
                .lean();
            if (!page) {
                return {
                    success: false,
                    message: 'Página no encontrada'
                };
            }
            return {
                success: true,
                data: page
            };
        }
        catch (error) {
            console.error('Error al obtener página por slug:', error);
            return {
                success: false,
                message: 'Error interno del servidor'
            };
        }
    }
    static async getPageBySlugAdmin(slug) {
        try {
            const page = await content_model_1.ContentPageModel
                .findOne({ slug })
                .lean();
            if (!page) {
                return {
                    success: false,
                    message: 'Página no encontrada'
                };
            }
            return {
                success: true,
                data: page
            };
        }
        catch (error) {
            console.error('Error al obtener página por slug (admin):', error);
            return {
                success: false,
                message: 'Error interno del servidor'
            };
        }
    }
    static async getPageById(id) {
        try {
            if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'ID de página inválido'
                };
            }
            const page = await content_model_1.ContentPageModel
                .findById(id)
                .lean();
            if (!page) {
                return {
                    success: false,
                    message: 'Página no encontrada'
                };
            }
            return {
                success: true,
                data: page
            };
        }
        catch (error) {
            console.error('Error al obtener página por ID:', error);
            return {
                success: false,
                message: 'Error interno del servidor'
            };
        }
    }
    static async createPage(data) {
        try {
            const existingPage = await content_model_1.ContentPageModel.findOne({ slug: data.slug });
            if (existingPage) {
                return {
                    success: false,
                    message: 'Ya existe una página con este slug'
                };
            }
            const newPage = new content_model_1.ContentPageModel(data);
            const isValid = newPage.validateStructure();
            if (!isValid) {
                return {
                    success: false,
                    message: 'La estructura de la página no es válida'
                };
            }
            await newPage.save();
            const createdPage = await content_model_1.ContentPageModel
                .findById(newPage._id)
                .lean();
            return {
                success: true,
                data: createdPage,
                message: 'Página creada exitosamente'
            };
        }
        catch (error) {
            console.error('Error al crear página:', error);
            if (error.code === 11000) {
                return {
                    success: false,
                    message: 'Ya existe una página con este slug'
                };
            }
            return {
                success: false,
                message: 'Error interno del servidor al crear la página'
            };
        }
    }
    static async updatePage(slug, data) {
        try {
            const existingPage = await content_model_1.ContentPageModel.findOne({ slug });
            if (!existingPage) {
                return {
                    success: false,
                    message: 'Página no encontrada'
                };
            }
            if (data.title !== undefined)
                existingPage.title = data.title;
            if (data.sections !== undefined) {
                existingPage.sections = data.sections.map(section => ({
                    title: section.title ?? '',
                    order: section.order ?? 0,
                    blocks: section.blocks?.map(block => ({
                        type: block.type,
                        value: block.value ?? '',
                        order: block.order ?? 0
                    })) ?? []
                }));
            }
            if (data.isActive !== undefined)
                existingPage.isActive = data.isActive;
            if (typeof data.modifiedBy === 'string') {
                existingPage.modifiedBy = new mongoose_1.default.Types.ObjectId(data.modifiedBy);
            }
            else {
                existingPage.modifiedBy = data.modifiedBy ?? existingPage.modifiedBy;
            }
            if (data.sections !== undefined) {
                const isValid = existingPage.validateStructure();
                if (!isValid) {
                    return {
                        success: false,
                        message: 'La estructura de la página no es válida'
                    };
                }
            }
            await existingPage.save();
            const updatedPage = await content_model_1.ContentPageModel
                .findById(existingPage._id)
                .lean();
            return {
                success: true,
                data: updatedPage,
                message: 'Página actualizada exitosamente'
            };
        }
        catch (error) {
            console.error('Error al actualizar página:', error);
            return {
                success: false,
                message: 'Error interno del servidor al actualizar la página'
            };
        }
    }
    static async deletePage(slug, modifiedBy) {
        try {
            const page = await content_model_1.ContentPageModel.findOne({ slug });
            if (!page) {
                return {
                    success: false,
                    message: 'Página no encontrada'
                };
            }
            page.isActive = false;
            page.modifiedBy = new mongoose_1.default.Types.ObjectId(modifiedBy);
            await page.save();
            return {
                success: true,
                message: 'Página eliminada exitosamente'
            };
        }
        catch (error) {
            console.error('Error al eliminar página:', error);
            return {
                success: false,
                message: 'Error interno del servidor al eliminar la página'
            };
        }
    }
    static async duplicatePage(originalSlug, newSlug, newTitle, modifiedBy) {
        try {
            const originalPage = await content_model_1.ContentPageModel.findOne({ slug: originalSlug });
            if (!originalPage) {
                return {
                    success: false,
                    message: 'Página original no encontrada'
                };
            }
            const existingPage = await content_model_1.ContentPageModel.findOne({ slug: newSlug });
            if (existingPage) {
                return {
                    success: false,
                    message: 'Ya existe una página con el nuevo slug'
                };
            }
            const duplicatedPage = new content_model_1.ContentPageModel({
                slug: newSlug,
                title: newTitle,
                sections: originalPage.sections,
                modifiedBy,
                isActive: true
            });
            await duplicatedPage.save();
            const createdPage = await content_model_1.ContentPageModel
                .findById(duplicatedPage._id)
                .lean();
            return {
                success: true,
                data: createdPage,
                message: 'Página duplicada exitosamente'
            };
        }
        catch (error) {
            console.error('Error al duplicar página:', error);
            return {
                success: false,
                message: 'Error interno del servidor al duplicar la página'
            };
        }
    }
}
exports.ContentService = ContentService;
