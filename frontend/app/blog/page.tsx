import BlogsPage from '@/modules/blog/components/BlogsPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blogs - PrepagoYa',
  description: 'Lee nuestros artículos y consejos sobre el mundo de los acompañantes.',
};

export default function BlogPage() {
  return <BlogsPage />;
}