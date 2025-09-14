'use client';

import { useState } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAdminBlogs, useDeleteBlog, useToggleBlog } from '../../../hooks/use-blogs';
import { blogService } from '../../../services/blog.service';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Skeleton } from '../../ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';

interface BlogCardProps {
  blog: {
    _id: string;
    title: string;
    slug: string;
    content: object;
    coverImage?: string;
    published: boolean;
    createdAt: string;
    updatedAt: string;
  };
  onEdit: (blogId: string) => void;
  onDelete: (blogId: string) => void;
  onToggle: (blogId: string, published: boolean) => void;
}

const BlogCard = ({ blog, onEdit, onDelete, onToggle }: BlogCardProps) => {
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
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
              <div className="text-2xl font-bold text-gray-400">Blog</div>
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            <Badge variant={blog.published ? "default" : "secondary"}>
              {blog.published ? "Publicado" : "Borrador"}
            </Badge>
          </div>

          {/* Actions Menu */}
          <div className="absolute top-3 right-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(blog._id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggle(blog._id, !blog.published)}>
                  {blog.published ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Despublicar
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Publicar
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(blog._id)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <span>Creado: {formattedDate}</span>
        </div>

        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {blog.title}
        </h3>

        <p className="text-sm text-gray-600 line-clamp-3 mb-4">
          {excerpt}
        </p>

        <div className="flex items-center justify-between">
          <Link
            href={`/blog/${blog.slug}`}
            target="_blank"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Ver en sitio →
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(blog._id)}
          >
            Editar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const BlogSkeleton = () => (
  <Card className="overflow-hidden">
    <CardHeader className="p-0">
      <Skeleton className="aspect-video w-full" />
    </CardHeader>
    <CardContent className="p-4">
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-6 w-full mb-2" />
      <Skeleton className="h-6 w-3/4 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3 mb-4" />
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-16" />
      </div>
    </CardContent>
  </Card>
);

const EmptyState = () => (
  <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
      <Search className="w-12 h-12 text-gray-400" />
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">
      No se encontraron blogs
    </h3>
    <p className="text-gray-600 max-w-md mb-6">
      No hay blogs que coincidan con los filtros actuales. Crea tu primer blog o ajusta los filtros.
    </p>
    <Link href="/adminboard/blogs/create">
      <Button>
        <Plus className="w-4 h-4 mr-2" />
        Crear primer blog
      </Button>
    </Link>
  </div>
);

export default function BlogsManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'title'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<string | null>(null);

  const { data, isLoading, error } = useAdminBlogs({
    search: searchTerm,
    published: statusFilter === 'all' ? undefined : statusFilter === 'published',
    page: currentPage,
    limit: 12,
    sortBy,
    sortOrder,
  });

  const deleteBlogMutation = useDeleteBlog();
  const toggleBlogMutation = useToggleBlog();

  const handleEdit = (blogId: string) => {
    window.location.href = `/adminboard/blogs/edit/${blogId}`;
  };

  const handleDelete = (blogId: string) => {
    setBlogToDelete(blogId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (blogToDelete) {
      deleteBlogMutation.mutate(blogToDelete);
      setDeleteDialogOpen(false);
      setBlogToDelete(null);
    }
  };

  const handleToggle = (blogId: string, published: boolean) => {
    toggleBlogMutation.mutate(blogId);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Blogs</h1>
          <p className="text-gray-600 mt-1">
            Administra los artículos del blog: crear, editar y publicar contenido.
          </p>
        </div>

        <Link href="/adminboard/blogs/create">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Crear Blog
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            {/* Innecesario, se puede filtrar pero falta configurar correctamente la peticion*/}
            {/* <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar blogs por título..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div> */}

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(value: 'all' | 'published' | 'draft') => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="published">Publicados</SelectItem>
                <SelectItem value="draft">Borradores</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select
              value={`${sortBy}-${sortOrder}`}
              onValueChange={(value) => {
                const [field, order] = value.split('-');
                setSortBy(field as 'createdAt' | 'updatedAt' | 'title');
                setSortOrder(order as 'asc' | 'desc');
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt-desc">Más recientes</SelectItem>
                <SelectItem value="createdAt-asc">Más antiguos</SelectItem>
                <SelectItem value="updatedAt-desc">Actualizados recientemente</SelectItem>
                <SelectItem value="title-asc">Título A-Z</SelectItem>
                <SelectItem value="title-desc">Título Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Count */}
          {data && (
            <div className="mt-4 text-sm text-gray-600">
              {data.total} blog{data.total !== 1 ? 's' : ''} encontrado{data.total !== 1 ? 's' : ''}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p className="font-semibold">Error al cargar los blogs</p>
              <p className="text-sm mt-1">{error.message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Blog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, index) => (
            <BlogSkeleton key={index} />
          ))
        ) : data?.blogs.length === 0 ? (
          <EmptyState />
        ) : (
          data?.blogs.map((blog) => (
            <BlogCard
              key={blog._id}
              blog={blog}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El blog será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}