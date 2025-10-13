import { Metadata } from 'next';
import BlogsPage from '@/modules/blog/components/BlogsPage';

export const metadata: Metadata = {
  title: 'Blogs - Online Escorts',
  description: 'Lee nuestros artículos y consejos sobre el mundo de los acompañantes.',
};

export default function BlogPage() {
  return <BlogsPage />;
}