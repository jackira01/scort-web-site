import { BlogCategory, IBlogCategory } from './blog-category.model';

export class BlogCategoryService {
  static async createCategory(data: Partial<IBlogCategory>): Promise<IBlogCategory> {
    if (!data.slug && data.name) {
      data.slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    }
    
    const category = new BlogCategory(data);
    return await category.save();
  }

  static async getCategories(): Promise<IBlogCategory[]> {
    return await BlogCategory.find().sort({ name: 1 });
  }

  static async getCategoryById(id: string): Promise<IBlogCategory | null> {
    return await BlogCategory.findById(id);
  }

  static async updateCategory(id: string, data: Partial<IBlogCategory>): Promise<IBlogCategory | null> {
    return await BlogCategory.findByIdAndUpdate(id, data, { new: true });
  }

  static async deleteCategory(id: string): Promise<boolean> {
    const result = await BlogCategory.findByIdAndDelete(id);
    return !!result;
  }
}
