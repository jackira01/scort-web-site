import { Blog, IBlog } from './blog.model';
import { FilterQuery, UpdateQuery } from 'mongoose';

export interface CreateBlogData {
  title: string;
  slug?: string;
  content: object;
  coverImage?: string;
  published?: boolean;
}

export interface UpdateBlogData {
  title?: string;
  slug?: string;
  content?: object;
  coverImage?: string;
  published?: boolean;
}

export interface BlogFilters {
  published?: boolean;
  search?: string;
  limit?: number;
  skip?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export class BlogService {
  /**
   * Crear un nuevo blog
   */
  static async createBlog(data: CreateBlogData): Promise<IBlog> {
    try {
      // Generar slug automático si no se proporciona
      if (!data.slug && data.title) {
        data.slug = data.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();

        // Verificar si el slug ya existe y agregar sufijo numérico si es necesario
        let slugExists = await Blog.findOne({ slug: data.slug });
        let counter = 1;
        const originalSlug = data.slug;

        while (slugExists) {
          data.slug = `${originalSlug}-${counter}`;
          slugExists = await Blog.findOne({ slug: data.slug });
          counter++;
        }
      }

      const blog = new Blog(data);
      await blog.save();
      return blog;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new Error('Ya existe un blog con ese slug');
      }
      throw new Error(`Error al crear el blog: ${error.message}`);
    }
  }

  /**
   * Obtener todos los blogs con filtros
   */
  static async getBlogs(filters: BlogFilters = {}): Promise<{
    blogs: IBlog[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const {
        published = true,
        search,
        limit = 10,
        skip = 0,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      // Construir query de filtros
      const query: FilterQuery<IBlog> = {};

      if (published !== undefined) {
        query.published = published;
      }

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { $text: { $search: search } }
        ];
      }

      // Construir sort
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Ejecutar consultas en paralelo
      const [blogs, total] = await Promise.all([
        Blog.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Blog.countDocuments(query)
      ]);

      const page = Math.floor(skip / limit) + 1;
      const totalPages = Math.ceil(total / limit);

      return {
        blogs: blogs as unknown as IBlog[],
        total,
        page,
        totalPages
      };
    } catch (error: any) {
      throw new Error(`Error al obtener los blogs: ${error.message}`);
    }
  }

  /**
   * Obtener un blog por ID o slug
   */
  static async getBlogByIdOrSlug(identifier: string): Promise<IBlog | null> {
    try {
      // Intentar buscar por ID primero, luego por slug
      let blog = await Blog.findById(identifier);

      if (!blog) {
        blog = await Blog.findOne({ slug: identifier });
      }

      return blog;
    } catch (error: any) {
      // Si falla la búsqueda por ID (formato inválido), buscar solo por slug
      try {
        return await Blog.findOne({ slug: identifier });
      } catch (slugError: any) {
        throw new Error(`Error al obtener el blog: ${error.message}`);
      }
    }
  }

  /**
   * Actualizar un blog
   */
  static async updateBlog(id: string, data: UpdateBlogData): Promise<IBlog | null> {
    try {
      // Si se actualiza el título y no se proporciona slug, regenerar slug
      if (data.title && !data.slug) {
        const newSlug = data.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();

        // Verificar si el nuevo slug ya existe (excluyendo el blog actual)
        const existingBlog = await Blog.findOne({
          slug: newSlug,
          _id: { $ne: id }
        });

        if (existingBlog) {
          let counter = 1;
          let uniqueSlug = `${newSlug}-${counter}`;

          while (await Blog.findOne({ slug: uniqueSlug, _id: { $ne: id } })) {
            counter++;
            uniqueSlug = `${newSlug}-${counter}`;
          }

          data.slug = uniqueSlug;
        } else {
          data.slug = newSlug;
        }
      }

      const updateData: UpdateQuery<IBlog> = {
        ...data,
        updatedAt: new Date()
      };

      const blog = await Blog.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      return blog;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new Error('Ya existe un blog con ese slug');
      }
      throw new Error(`Error al actualizar el blog: ${error.message}`);
    }
  }

  /**
   * Alternar estado publicado/no publicado
   */
  static async toggleBlogStatus(id: string): Promise<IBlog | null> {
    try {
      const blog = await Blog.findById(id);

      if (!blog) {
        throw new Error('Blog no encontrado');
      }

      blog.published = !blog.published;
      blog.updatedAt = new Date();

      await blog.save();
      return blog;
    } catch (error: any) {
      throw new Error(`Error al cambiar el estado del blog: ${error.message}`);
    }
  }

  /**
   * Eliminar un blog
   */
  static async deleteBlog(id: string): Promise<boolean> {
    try {
      const result = await Blog.findByIdAndDelete(id);
      return !!result;
    } catch (error: any) {
      throw new Error(`Error al eliminar el blog: ${error.message}`);
    }
  }

  /**
   * Obtener blogs relacionados (por ejemplo, los más recientes excluyendo el actual)
   */
  static async getRelatedBlogs(currentBlogId: string, limit: number = 3): Promise<IBlog[]> {
    try {
      const blogs = await Blog.find({
        _id: { $ne: currentBlogId },
        published: true
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return blogs as unknown as IBlog[];
    } catch (error: any) {
      throw new Error(`Error al obtener blogs relacionados: ${error.message}`);
    }
  }

  /**
   * Buscar blogs por texto
   */
  static async searchBlogs(searchTerm: string, limit: number = 10): Promise<IBlog[]> {
    try {
      const blogs = await Blog.find({
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

      return blogs as unknown as IBlog[];
    } catch (error: any) {
      throw new Error(`Error al buscar blogs: ${error.message}`);
    }
  }
}

export default BlogService;