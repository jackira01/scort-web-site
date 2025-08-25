'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Eye, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useBlogById, useUpdateBlog, useDeleteBlog, useToggleBlog } from '../../../../../src/hooks/use-blogs';
import { blogService } from '../../../../../src/services/blog.service';
import { Button } from '../../../../../src/components/ui/button';
import { Input } from '../../../../../src/components/ui/input';
import { Label } from '../../../../../src/components/ui/label';
import { Textarea } from '../../../../../src/components/ui/textarea';
import { Switch } from '../../../../../src/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../src/components/ui/card';
import { Badge } from '../../../../../src/components/ui/badge';
import { Separator } from '../../../../../src/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../../../src/components/ui/alert-dialog';
import { toast } from 'react-hot-toast';

interface BlogFormData {
  title: string;
  slug: string;
  content: object;
  coverImage: string;
  published: boolean;
}

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const blogId = params.id as string;

  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    slug: '',
    content: { blocks: [] },
    coverImage: '',
    published: false,
  });
  const [contentText, setContentText] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [errors, setErrors] = useState<Partial<BlogFormData>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  const { data: blog, isLoading, error } = useBlogById(blogId);
  const updateBlogMutation = useUpdateBlog();
  const deleteBlogMutation = useDeleteBlog();
  const toggleBlogMutation = useToggleBlog();

  // Initialize form data when blog is loaded
  useEffect(() => {
    if (blog && !isInitialized) {
      setFormData({
        title: blog.title,
        slug: blog.slug,
        content: blog.content,
        coverImage: blog.coverImage || '',
        published: blog.published,
      });

      // Convert content to text for editing
      if (blog.content && Array.isArray((blog.content as any).blocks)) {
        const text = (blog.content as any).blocks.map((block: any) => {
          switch (block.type) {
            case 'header':
              const level = '#'.repeat(block.data?.level || 2);
              return `${level} ${block.data?.text || ''}`;
            case 'paragraph':
            default:
              return block.data?.text || '';
          }
        }).join('\n\n');
        setContentText(text);
      }

      setIsInitialized(true);
    }
  }, [blog, isInitialized]);

  const validateForm = (): boolean => {
    const newErrors: Partial<BlogFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'El slug es requerido';
    }

    if (!contentText.trim()) {
      newErrors.content = 'El contenido es requerido';
    }

    if (formData.coverImage && !blogService.isValidImageUrl(formData.coverImage)) {
      newErrors.coverImage = 'La URL de la imagen no es válida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      // Only auto-generate slug if it matches the current auto-generated slug
      slug: prev.slug === blogService.generateSlug(prev.title)
        ? blogService.generateSlug(title)
        : prev.slug
    }));
    if (errors.title) {
      setErrors(prev => ({ ...prev, title: undefined }));
    }
  };

  const handleSlugChange = (slug: string) => {
    setFormData(prev => ({
      ...prev,
      slug: blogService.generateSlug(slug)
    }));
    if (errors.slug) {
      setErrors(prev => ({ ...prev, slug: undefined }));
    }
  };

  const handleContentChange = (content: string) => {
    setContentText(content);

    // Convert simple text to Editor.js format
    const blocks = content.split('\n\n').filter(paragraph => paragraph.trim()).map(paragraph => {
      const trimmed = paragraph.trim();

      // Check if it's a header (starts with #)
      if (trimmed.startsWith('#')) {
        const level = trimmed.match(/^#+/)?.[0].length || 2;
        const text = trimmed.replace(/^#+\s*/, '');
        return {
          type: 'header',
          data: {
            text,
            level: Math.min(level, 6)
          }
        };
      }

      // Regular paragraph
      return {
        type: 'paragraph',
        data: {
          text: trimmed
        }
      };
    });

    setFormData(prev => ({
      ...prev,
      content: { blocks }
    }));

    if (errors.content) {
      setErrors(prev => ({ ...prev, content: undefined }));
    }
  };

  const handleCoverImageChange = (coverImage: string) => {
    setFormData(prev => ({ ...prev, coverImage }));
    if (errors.coverImage) {
      setErrors(prev => ({ ...prev, coverImage: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    try {
      await updateBlogMutation.mutateAsync({
        id: blogId,
        data: {
          title: formData.title,
          slug: formData.slug,
          content: formData.content,
          coverImage: formData.coverImage || undefined,
          published: formData.published,
        }
      });

      toast.success('Blog actualizado exitosamente');
      router.push('/adminboard?section=blogs');
    } catch (error) {
      console.error('Error updating blog:', error);
    }
  };

  const handleToggleStatus = async () => {
    try {
      await toggleBlogMutation.mutateAsync(blogId);
      setFormData(prev => ({ ...prev, published: !prev.published }));
    } catch (error) {
      console.error('Error toggling blog status:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteBlogMutation.mutateAsync(blogId);
      toast.success('Blog eliminado exitosamente');
      router.push('/adminboard?section=blogs');
    } catch (error) {
      console.error('Error deleting blog:', error);
    }
  };

  const renderPreview = () => {
    if (!formData.content || !Array.isArray((formData.content as any).blocks)) {
      return <p className="text-gray-500">No hay contenido para mostrar</p>;
    }

    return (
      <div className="prose prose-lg max-w-none">
        {(formData.content as any).blocks.map((block: any, index: number) => {
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
            default:
              return (
                <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                  {block.data?.text || ''}
                </p>
              );
          }
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando blog...</p>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Blog no encontrado</h1>
          <p className="text-gray-600 mb-6">El blog que buscas no existe o ha sido eliminado.</p>
          <Link
            href="/adminboard?section=blogs"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Blogs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/adminboard?section=blogs"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver a Blogs
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <h1 className="text-xl font-semibold text-gray-900">Editar Blog</h1>
              <Badge variant={formData.published ? "default" : "secondary"}>
                {formData.published ? "Publicado" : "Borrador"}
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                {isPreviewMode ? 'Editar' : 'Vista Previa'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleToggleStatus}
                disabled={toggleBlogMutation.isPending}
                className="flex items-center gap-2"
              >
                {formData.published ? (
                  <ToggleRight className="w-4 h-4" />
                ) : (
                  <ToggleLeft className="w-4 h-4" />
                )}
                {formData.published ? 'Despublicar' : 'Publicar'}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
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
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                type="submit"
                form="blog-form"
                disabled={updateBlogMutation.isPending}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Guardar Cambios
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isPreviewMode ? (
          /* Preview Mode */
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Vista Previa del Blog</CardTitle>
                  <Badge variant={formData.published ? "default" : "secondary"}>
                    {formData.published ? "Publicado" : "Borrador"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Preview Header */}
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {formData.title || 'Título del blog'}
                  </h1>
                  <div className="text-sm text-gray-600 mb-6">
                    <span>Slug: /{formData.slug || 'slug-del-blog'}</span>
                    {blog && (
                      <>
                        <span className="mx-2">•</span>
                        <span>Creado: {blogService.formatDate(blog.createdAt)}</span>
                        <span className="mx-2">•</span>
                        <span>Actualizado: {blogService.formatDate(blog.updatedAt)}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Preview Cover Image */}
                {formData.coverImage && (
                  <div className="aspect-video overflow-hidden rounded-lg border">
                    <img
                      src={formData.coverImage}
                      alt={formData.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Preview Content */}
                <div>
                  {renderPreview()}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Edit Mode */
          <form id="blog-form" onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Title */}
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Ingresa el título del blog"
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600 mt-1">{errors.title}</p>
                  )}
                </div>

                {/* Slug */}
                <div>
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="slug-del-blog"
                    className={errors.slug ? 'border-red-500' : ''}
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    URL del blog: /blog/{formData.slug || 'slug-del-blog'}
                  </p>
                  {errors.slug && (
                    <p className="text-sm text-red-600 mt-1">{errors.slug}</p>
                  )}
                </div>

                {/* Cover Image */}
                <div>
                  <Label htmlFor="coverImage">Imagen de Portada</Label>
                  <Input
                    id="coverImage"
                    value={formData.coverImage}
                    onChange={(e) => handleCoverImageChange(e.target.value)}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    className={errors.coverImage ? 'border-red-500' : ''}
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    URL de la imagen de portada (opcional)
                  </p>
                  {errors.coverImage && (
                    <p className="text-sm text-red-600 mt-1">{errors.coverImage}</p>
                  )}

                  {/* Image Preview */}
                  {formData.coverImage && blogService.isValidImageUrl(formData.coverImage) && (
                    <div className="mt-3">
                      <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg border">
                        <img
                          src={formData.coverImage}
                          alt="Vista previa"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Published Status */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="published"
                    checked={formData.published}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({ ...prev, published: checked }))
                    }
                  />
                  <Label htmlFor="published">
                    Blog publicado
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Content */}
            <Card>
              <CardHeader>
                <CardTitle>Contenido *</CardTitle>
                <p className="text-sm text-gray-600">
                  Escribe el contenido del blog. Puedes usar # para títulos (ej: # Título, ## Subtítulo).
                </p>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={contentText}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Escribe el contenido del blog aquí...&#10;&#10;# Título Principal&#10;&#10;Este es un párrafo de ejemplo.&#10;&#10;## Subtítulo&#10;&#10;Otro párrafo con más contenido."
                  className={`min-h-[400px] font-mono text-sm ${errors.content ? 'border-red-500' : ''}`}
                />
                {errors.content && (
                  <p className="text-sm text-red-600 mt-1">{errors.content}</p>
                )}
              </CardContent>
            </Card>
          </form>
        )}
      </div>
    </div>
  );
}