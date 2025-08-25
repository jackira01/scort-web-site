'use client';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar, Share2, Eye, Clock } from 'lucide-react';
import { useBlogBySlug, useRelatedBlogs } from '../../../src/hooks/use-blogs';
import { blogService } from '../../../src/services/blog.service';
import { Button } from '../../../src/components/ui/button';
import { Card, CardContent, CardHeader } from '../../../src/components/ui/card';
import { Skeleton } from '../../../src/components/ui/skeleton';
import { Badge } from '../../../src/components/ui/badge';

interface BlogDetailPageProps {
  params: {
    slug: string;
  };
}

interface RelatedBlogCardProps {
  blog: {
    _id: string;
    title: string;
    slug: string;
    content: object;
    coverImage?: string;
    createdAt: string;
  };
}

const RelatedBlogCard = ({ blog }: RelatedBlogCardProps) => {
  const formattedDate = blogService.formatDate(blog.createdAt);
  const excerpt = blogService.extractTextFromContent(blog.content);

  return (
    <Card className="group hover:shadow-md transition-all duration-300">
      <CardHeader className="p-0">
        <div className="relative aspect-video overflow-hidden rounded-t-lg">
          {blog.coverImage ? (
            <Image
              src={blog.coverImage}
              alt={blog.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, 300px"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
              <div className="text-2xl font-bold text-gray-400">Blog</div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <Calendar className="w-3 h-3" />
          <span>{formattedDate}</span>
        </div>

        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {blog.title}
        </h3>

        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {excerpt}
        </p>

        <Link
          href={`/blog/${blog.slug}`}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          Leer más →
        </Link>
      </CardContent>
    </Card>
  );
};

const BlogContentRenderer = ({ content }: { content: object }) => {
  // Simple JSON content renderer
  // In a real implementation, you would use Editor.js renderer or similar
  const renderContent = (contentObj: any) => {
    if (!contentObj || typeof contentObj !== 'object') {
      return <p className="text-gray-600">Contenido no disponible</p>;
    }

    // Handle Editor.js format
    if (contentObj.blocks && Array.isArray(contentObj.blocks)) {
      return contentObj.blocks.map((block: any, index: number) => {
        switch (block.type) {
          case 'paragraph':
            return (
              <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                {block.data?.text || ''}
              </p>
            );
          case 'header':
            const HeaderTag = `h${block.data?.level || 2}` as keyof JSX.IntrinsicElements;
            return (
              <HeaderTag key={index} className="font-bold text-gray-900 mb-4 mt-8">
                {block.data?.text || ''}
              </HeaderTag>
            );
          case 'list':
            const ListTag = block.data?.style === 'ordered' ? 'ol' : 'ul';
            return (
              <ListTag key={index} className="mb-4 ml-6 space-y-2">
                {block.data?.items?.map((item: string, itemIndex: number) => (
                  <li key={itemIndex} className="text-gray-700">{item}</li>
                ))}
              </ListTag>
            );
          case 'quote':
            return (
              <blockquote key={index} className="border-l-4 border-blue-500 pl-6 py-4 mb-4 bg-blue-50 italic text-gray-700">
                {block.data?.text || ''}
                {block.data?.caption && (
                  <cite className="block mt-2 text-sm text-gray-500 not-italic">
                    — {block.data.caption}
                  </cite>
                )}
              </blockquote>
            );
          case 'image':
            return (
              <figure key={index} className="mb-6">
                <div className="relative aspect-video overflow-hidden rounded-lg">
                  <Image
                    src={block.data?.file?.url || block.data?.url || ''}
                    alt={block.data?.caption || 'Imagen del blog'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 800px"
                  />
                </div>
                {block.data?.caption && (
                  <figcaption className="text-sm text-gray-500 text-center mt-2">
                    {block.data.caption}
                  </figcaption>
                )}
              </figure>
            );
          default:
            return (
              <div key={index} className="mb-4 p-4 bg-gray-100 rounded-lg">
                <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                  {JSON.stringify(block, null, 2)}
                </pre>
              </div>
            );
        }
      });
    }

    // Fallback for simple text content
    if (typeof contentObj === 'string') {
      return <p className="text-gray-700 leading-relaxed">{contentObj}</p>;
    }

    // Fallback for unknown format
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <pre className="text-sm text-gray-600 whitespace-pre-wrap">
          {JSON.stringify(contentObj, null, 2)}
        </pre>
      </div>
    );
  };

  return <div className="prose prose-lg max-w-none">{renderContent(content)}</div>;
};

const BlogDetailSkeleton = () => (
  <div className="min-h-screen bg-gray-50">
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
  const { data: blog, isLoading, error } = useBlogBySlug(params.slug);
  const { data: relatedBlogs } = useRelatedBlogs(blog?._id, { limit: 3 });

  if (isLoading) {
    return <BlogDetailSkeleton />;
  }

  if (error || !blog) {
    notFound();
  }

  const formattedDate = blogService.formatDate(blog.createdAt);
  const readingTime = Math.ceil(blogService.extractTextFromContent(blog.content).length / 200);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: blog.title,
          text: blogService.extractTextFromContent(blog.content).substring(0, 100) + '...',
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // You could show a toast notification here
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al blog
          </Link>
        </div>
      </nav>

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {blog.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{readingTime} min de lectura</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="ml-auto"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartir
            </Button>
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
              sizes="(max-width: 768px) 100vw, 800px"
              priority
            />
          </div>
        )}

        {/* Content */}
        <div className="mb-12">
          <BlogContentRenderer content={blog.content} />
        </div>

        {/* Share Section */}
        <div className="border-t border-gray-200 pt-8 mb-12">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              ¿Te gustó este artículo?
            </h3>
            <Button onClick={handleShare} className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Compartir
            </Button>
          </div>
        </div>
      </article>

      {/* Related Blogs */}
      {relatedBlogs && relatedBlogs.length > 0 && (
        <section className="bg-white border-t">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Artículos relacionados
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedBlogs.map((relatedBlog) => (
                <RelatedBlogCard key={relatedBlog._id} blog={relatedBlog} />
              ))}
            </div>

            <div className="text-center mt-8">
              <Link href="/blog">
                <Button variant="outline">
                  Ver todos los artículos
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}