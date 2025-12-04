import { BlogCategoriesManager } from '@/modules/adminboard/components/BlogCategoriesManager';
import AdminProtection from '@/components/AdminProtection';

export default function BlogCategoriesPage() {
  return (
    <AdminProtection>
      <div className="p-6">
        <BlogCategoriesManager />
      </div>
    </AdminProtection>
  );
}
