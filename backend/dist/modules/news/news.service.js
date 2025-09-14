"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsService = void 0;
const news_model_1 = require("./news.model");
class NewsService {
    static async createNews(data) {
        try {
            const news = new news_model_1.News({
                title: data.title,
                content: data.content,
                published: data.published ?? true
            });
            return await news.save();
        }
        catch (error) {
            throw new Error(`Error al crear la noticia: ${error.message}`);
        }
    }
    static async getNews(filters = {}) {
        try {
            const { published, search, limit = 10, skip = 0, sortBy = 'createdAt', sortOrder = 'desc' } = filters;
            const query = {};
            if (published !== undefined) {
                query.published = published;
            }
            if (search) {
                query.$text = { $search: search };
            }
            const sort = {};
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
            const [news, total] = await Promise.all([
                news_model_1.News.find(query)
                    .sort(sort)
                    .limit(limit)
                    .skip(skip)
                    .lean(),
                news_model_1.News.countDocuments(query)
            ]);
            const page = Math.floor(skip / limit) + 1;
            const totalPages = Math.ceil(total / limit);
            return {
                news,
                total,
                page,
                totalPages
            };
        }
        catch (error) {
            throw new Error(`Error al obtener noticias: ${error.message}`);
        }
    }
    static async getNewsById(id) {
        try {
            return await news_model_1.News.findById(id);
        }
        catch (error) {
            throw new Error(`Error al obtener la noticia: ${error.message}`);
        }
    }
    static async updateNews(id, data) {
        try {
            const updateData = {};
            if (data.title !== undefined) {
                updateData.title = data.title;
            }
            if (data.content !== undefined) {
                updateData.content = data.content;
            }
            if (data.published !== undefined) {
                updateData.published = data.published;
            }
            return await news_model_1.News.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        }
        catch (error) {
            throw new Error(`Error al actualizar la noticia: ${error.message}`);
        }
    }
    static async toggleNewsStatus(id) {
        try {
            const news = await news_model_1.News.findById(id);
            if (!news) {
                throw new Error('Noticia no encontrada');
            }
            news.published = !news.published;
            return await news.save();
        }
        catch (error) {
            throw new Error(`Error al cambiar estado de la noticia: ${error.message}`);
        }
    }
    static async deleteNews(id) {
        try {
            const result = await news_model_1.News.findByIdAndDelete(id);
            return !!result;
        }
        catch (error) {
            throw new Error(`Error al eliminar la noticia: ${error.message}`);
        }
    }
    static async searchNews(searchTerm, limit = 10) {
        try {
            return await news_model_1.News.find({
                $text: { $search: searchTerm },
                published: true
            }, { score: { $meta: 'textScore' } })
                .sort({ score: { $meta: 'textScore' } })
                .limit(limit)
                .lean();
        }
        catch (error) {
            throw new Error(`Error en la búsqueda de noticias: ${error.message}`);
        }
    }
    static async getLatestNews(limit = 5) {
        try {
            return await news_model_1.News.find({ published: true })
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean();
        }
        catch (error) {
            throw new Error(`Error al obtener las últimas noticias: ${error.message}`);
        }
    }
}
exports.NewsService = NewsService;
exports.default = NewsService;
