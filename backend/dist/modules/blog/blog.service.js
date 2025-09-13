"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogService = void 0;
const blog_model_1 = require("./blog.model");
class BlogService {
    static async createBlog(data) {
        try {
            if (!data.slug && data.title) {
                data.slug = data.title
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .trim();
                let slugExists = await blog_model_1.Blog.findOne({ slug: data.slug });
                let counter = 1;
                const originalSlug = data.slug;
                while (slugExists) {
                    data.slug = `${originalSlug}-${counter}`;
                    slugExists = await blog_model_1.Blog.findOne({ slug: data.slug });
                    counter++;
                }
            }
            const blog = new blog_model_1.Blog(data);
            await blog.save();
            return blog;
        }
        catch (error) {
            if (error.code === 11000) {
                throw new Error('Ya existe un blog con ese slug');
            }
            throw new Error(`Error al crear el blog: ${error.message}`);
        }
    }
    static async getBlogs(filters = {}) {
        try {
            const { published = true, search, limit = 10, skip = 0, sortBy = 'createdAt', sortOrder = 'desc' } = filters;
            const query = {};
            if (published !== undefined) {
                query.published = published;
            }
            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { $text: { $search: search } }
                ];
            }
            const sort = {};
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
            const [blogs, total] = await Promise.all([
                blog_model_1.Blog.find(query)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                blog_model_1.Blog.countDocuments(query)
            ]);
            const page = Math.floor(skip / limit) + 1;
            const totalPages = Math.ceil(total / limit);
            return {
                blogs: blogs,
                total,
                page,
                totalPages
            };
        }
        catch (error) {
            throw new Error(`Error al obtener los blogs: ${error.message}`);
        }
    }
    static async getBlogByIdOrSlug(identifier) {
        try {
            let blog = await blog_model_1.Blog.findById(identifier);
            if (!blog) {
                blog = await blog_model_1.Blog.findOne({ slug: identifier });
            }
            return blog;
        }
        catch (error) {
            try {
                return await blog_model_1.Blog.findOne({ slug: identifier });
            }
            catch (slugError) {
                throw new Error(`Error al obtener el blog: ${error.message}`);
            }
        }
    }
    static async updateBlog(id, data) {
        try {
            if (data.title && !data.slug) {
                const newSlug = data.title
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .trim();
                const existingBlog = await blog_model_1.Blog.findOne({
                    slug: newSlug,
                    _id: { $ne: id }
                });
                if (existingBlog) {
                    let counter = 1;
                    let uniqueSlug = `${newSlug}-${counter}`;
                    while (await blog_model_1.Blog.findOne({ slug: uniqueSlug, _id: { $ne: id } })) {
                        counter++;
                        uniqueSlug = `${newSlug}-${counter}`;
                    }
                    data.slug = uniqueSlug;
                }
                else {
                    data.slug = newSlug;
                }
            }
            const updateData = {
                ...data,
                updatedAt: new Date()
            };
            const blog = await blog_model_1.Blog.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
            return blog;
        }
        catch (error) {
            if (error.code === 11000) {
                throw new Error('Ya existe un blog con ese slug');
            }
            throw new Error(`Error al actualizar el blog: ${error.message}`);
        }
    }
    static async toggleBlogStatus(id) {
        try {
            const blog = await blog_model_1.Blog.findById(id);
            if (!blog) {
                throw new Error('Blog no encontrado');
            }
            blog.published = !blog.published;
            blog.updatedAt = new Date();
            await blog.save();
            return blog;
        }
        catch (error) {
            throw new Error(`Error al cambiar el estado del blog: ${error.message}`);
        }
    }
    static async deleteBlog(id) {
        try {
            const result = await blog_model_1.Blog.findByIdAndDelete(id);
            return !!result;
        }
        catch (error) {
            throw new Error(`Error al eliminar el blog: ${error.message}`);
        }
    }
    static async getRelatedBlogs(currentBlogId, limit = 3) {
        try {
            const blogs = await blog_model_1.Blog.find({
                _id: { $ne: currentBlogId },
                published: true
            })
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean();
            return blogs;
        }
        catch (error) {
            throw new Error(`Error al obtener blogs relacionados: ${error.message}`);
        }
    }
    static async searchBlogs(searchTerm, limit = 10) {
        try {
            const blogs = await blog_model_1.Blog.find({
                $and: [
                    { published: true },
                    {
                        $or: [
                            { title: { $regex: searchTerm, $options: 'i' } },
                            { $text: { $search: searchTerm } }
                        ]
                    }
                ]
            })
                .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
                .limit(limit)
                .lean();
            return blogs;
        }
        catch (error) {
            throw new Error(`Error al buscar blogs: ${error.message}`);
        }
    }
}
exports.BlogService = BlogService;
exports.default = BlogService;
