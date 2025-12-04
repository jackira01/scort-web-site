'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { usePublishedBlogs } from '@/hooks/use-blogs';
import { blogService } from '@/services/blog.service';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface BlogCardProps {
    blog: {
        _id: string;
        title: string;
        slug: string;
        content: object;
        coverImage?: string;
        updatedAt: string;
    };
}

const BlogCard = ({ blog }: BlogCardProps) => {
    const formattedDate = blogService.formatDate(blog.updatedAt);
    const excerpt = blogService.extractTextFromContent(blog.content);

    return (
        <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
            <CardHeader className="p-0">
                <div className="relative aspect-video overflow-hidden">
                    {blog.coverImage ? (
                        <Image
                            src={blog.coverImage}
                            alt={blog.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
                            <div className="text-4xl font-bold text-gray-400 dark:text-gray-200">Blog</div>
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="p-6">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <Calendar className="w-4 h-4" />
                    <span>{formattedDate}</span>
                </div>

                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {blog.title}
                </h2>

                <p className="text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
                    {excerpt}
                </p>
            </CardContent>

            <CardFooter className="p-6 pt-0">
                <Link
                    href={`/blog/${blog.slug}`}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                    Leer más
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </CardFooter>
        </Card>
    );
};

const BlogSkeleton = () => (
    <Card className="overflow-hidden">
        <CardHeader className="p-0">
            <Skeleton className="aspect-video w-full" />
        </CardHeader>
        <CardContent className="p-6">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-6 w-3/4 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
        </CardContent>
        <CardFooter className="p-6 pt-0">
            <Skeleton className="h-4 w-20" />
        </CardFooter>
    </Card>
);

const EmptyState = () => (
    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
            <Search className="w-12 h-12 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No se encontraron blogs
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md">
            No hay blogs publicados en este momento. Vuelve pronto para ver nuevo contenido.
        </p>
    </div>
);

const BlogsPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState<'updatedAt' | 'title'>('updatedAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const { data, isLoading, error } = usePublishedBlogs({
        search: searchTerm,
        page: currentPage,
        limit: 12,
        sortBy,
        sortOrder,
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1); // Reset to first page when searching
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-200 mb-6">
                            Blog
                        </h1>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 dark:text-gray-200">
                            Descubre artículos, noticias y contenido interesante en nuestro blog.
                            Mantente al día con las últimas tendencias y novedades.
                        </p>

                        {/* Search Bar */}
                        {/* <form onSubmit={handleSearch} className="max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Buscar en el blog..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full"
                />
              </div>
            </form> */}
                    </div>
                </div>
            </section>

            {/* Filters */}
            <section className="border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ordenar por:</span>
                            <select
                                value={`${sortBy}-${sortOrder}`}
                                onChange={(e) => {
                                    const [field, order] = e.target.value.split('-');
                                    setSortBy(field as 'updatedAt' | 'title');
                                    setSortOrder(order as 'asc' | 'desc');
                                    setCurrentPage(1);
                                }}
                                className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="updatedAt-desc">Más recientes</option>
                                <option value="updatedAt-asc">Más antiguos</option>
                                <option value="title-asc">Título A-Z</option>
                                <option value="title-desc">Título Z-A</option>
                            </select>
                        </div>

                        {data && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                {data.total} blog{data.total !== 1 ? 's' : ''} encontrado{data.total !== 1 ? 's' : ''}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Blog Grid */}
            <section className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
                            <h3 className="text-red-800 font-semibold mb-2">Error al cargar los blogs</h3>
                            <p className="text-red-600">{error.message}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {isLoading ? (
                            // Loading skeletons
                            Array.from({ length: 6 }).map((_, index) => (
                                <BlogSkeleton key={index} />
                            ))
                        ) : data?.blogs.length === 0 ? (
                            <EmptyState />
                        ) : (
                            data?.blogs.map((blog) => (
                                <BlogCard key={blog._id} blog={blog} />
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    {data && data.totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-12">
                            <Button
                                variant="outline"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                Anterior
                            </Button>

                            <div className="flex gap-1">
                                {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (data.totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= data.totalPages - 2) {
                                        pageNum = data.totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }

                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={currentPage === pageNum ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handlePageChange(pageNum)}
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                })}
                            </div>

                            <Button
                                variant="outline"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === data.totalPages}
                            >
                                Siguiente
                            </Button>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default BlogsPage;