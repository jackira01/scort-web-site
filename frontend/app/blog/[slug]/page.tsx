'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { useBlog, useRelatedBlogs } from '../../../src/hooks/use-blogs';
import { blogService } from '../../../src/services/blog.service';
import { Button } from '../../../src/components/ui/button';
import { Skeleton } from '../../../src/components/ui/skeleton';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const BlogRenderer = dynamic(
  () => import('@/components/blog/BlogRenderer'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }
);
interface BlogDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

const BlogDetailSkeleton = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Skeleton className="h-8 w-32 mb-6" />
      <Skeleton className="h-12 w-3/4 mb-4" />
      <Skeleton className="h-6 w-48 mb-8" />
      <Skeleton className="aspect-video w-full mb-8" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  </div>
);

export default function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = use(params);
  const { data: blog, isLoading, error } = useBlog(slug);
  const { data: relatedBlogs } = useRelatedBlogs(blog?._id || '', 3);

  if (isLoading) {
    return <BlogDetailSkeleton />;
  }

  if (error || !blog) {
    notFound();
  }

  const formattedDate = blogService.formatDate(blog.createdAt);
  const extractedText = blogService.extractTextFromContent(blog.content);
  const readingTime = Math.ceil((extractedText?.length || 0) / 200);



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al blog
          </Link>
        </div>
      </nav>

      {/* Main Layout - 75/25 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content - 70% */}
          <article className="flex-1 lg:w-[70%]">
            {/* Header */}
            <header className="mb-8">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6 leading-tight">
                {blog.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{readingTime} min de lectura</span>
                </div>
              </div>
            </header>

            {/* Cover Image */}
            {blog.coverImage && (
              <div className="relative aspect-video overflow-hidden rounded-xl mb-8 shadow-lg">
                <Image
                  src={blog.coverImage}
                  alt={blog.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 75vw, 800px"
                  priority
                />
              </div>
            )}

            {/* Content */}
            <div className="mb-12">
              <BlogRenderer content={blog.content || { blocks: [] }} />
            </div>
          </article>

          {/* Sidebar - 35% */}
          <aside className="lg:w-[30%] lg:sticky lg:top-24 lg:self-start">
            {/* Related Blogs */}
            {relatedBlogs && relatedBlogs.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                  Artículos relacionados
                </h2>

                <div className="space-y-4">
                  {relatedBlogs.map((relatedBlog) => (
                    <div key={relatedBlog._id} className="group">
                      <div className="flex gap-3">
                        <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg">
                          {relatedBlog.coverImage ? (
                            <Image
                              src={relatedBlog.coverImage}
                              alt={relatedBlog.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="72px"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
                              <div className="text-xs font-bold text-gray-400 dark:text-gray-500">Blog</div>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 text-md line-clamp-2 group-hover:text-blue-600 transition-colors mb-1">
                            <Link href={`/blog/${relatedBlog.slug}`}>
                              {relatedBlog.title}
                            </Link>
                          </h3>

                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <Calendar className="w-3 h-3" />
                            <span>{blogService.formatDate(relatedBlog.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t dark:border-gray-700">
                  <Link href="/blog">
                    <Button variant="outline" size="sm" className="w-full">
                      Ver todos los artículos
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}