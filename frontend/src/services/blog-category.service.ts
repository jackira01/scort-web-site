import { API_URL } from '@/lib/config';

export interface BlogCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

class BlogCategoryService {
  private baseUrl = `${API_URL}/api/blog-categories`;

  private getAuthHeaders(): HeadersInit {
    // Ensure we are in the browser before accessing localStorage
    if (typeof window === 'undefined') return { 'Content-Type': 'application/json' };
    
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');

    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(userId && !token && { 'X-User-ID': userId }),
    };
  }

  async getAll(): Promise<BlogCategory[]> {
    const response = await fetch(this.baseUrl, {
      headers: { 'Content-Type': 'application/json' }, // Public access for reading? Or admin only?
      // The routes are public for getAll, but let's send auth if available just in case
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  }

  async create(data: Partial<BlogCategory>): Promise<BlogCategory> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const res = await response.json();
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async update(id: string, data: Partial<BlogCategory>): Promise<BlogCategory> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const res = await response.json();
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    const res = await response.json();
    if (!res.success) throw new Error(res.message);
  }
}

export const blogCategoryService = new BlogCategoryService();
