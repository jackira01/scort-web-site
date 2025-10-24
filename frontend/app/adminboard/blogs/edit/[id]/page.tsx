'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Eye, Trash2, ToggleLeft, ToggleRight, Upload } from 'lucide-react';
import { useBlog, useUpdateBlog, useDeleteBlog, useToggleBlog } from '../../../../../src/hooks/use-blogs';
import { blogService } from '../../../../../src/services/blog.service';
import { useDeferredUpload } from '../../../../../src/hooks/use-deferred-upload';
import { Button } from '../../../../../src/components/ui/button';
import { Input } from '../../../../../src/components/ui/input';
import { Label } from '../../../../../src/components/ui/label';
import dynamic from 'next/dynamic';

const BlogEditor = dynamic(() => import('../../../../../src/components/blog/BlogEditor'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[400px] border border-border rounded-lg p-4 bg-background flex items-center justify-center">
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
        <span className="text-muted-foreground">Cargando editor...</span>
      </div>
    </div>
  )
});

import { BlogEditorRef } from '../../../../../src/components/blog/BlogEditor';
import type { OutputData } from '@editorjs/editorjs';
import { Switch } from '../../../../../src/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../src/components/ui/card';
import { Badge } from '../../../../../src/components/ui/badge';
import { Separator } from '../../../../../src/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../../../src/components/ui/alert-dialog';
import toast from 'react-hot-toast';
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

interface BlogFormData {
  title: string;
  slug: string;
  content: OutputData;
  coverImage: string;
  coverImageFileId?: string;
  published: boolean;
}

interface BlogFormErrors {
  title?: string;
  slug?: string;
  content?: string;
  coverImage?: string;
  published?: string;
}

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const blogId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<BlogEditorRef>(null);

  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    slug: '',
    content: { blocks: [], time: Date.now(), version: '2.28.2' },
    coverImage: '',
    coverImageFileId: undefined,
    published: false,
  });
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [errors, setErrors] = useState<BlogFormErrors>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  const { data: blog, isLoading, error } = useBlog(blogId);
  const updateBlogMutation = useUpdateBlog();
  const deleteBlogMutation = useDeleteBlog();
  const toggleBlogMutation = useToggleBlog();
  const { addPendingFile, removePendingFile, uploadAllPendingFiles, getPreviewUrl, clearPendingFiles, processEditorContent } = useDeferredUpload();

  // Limpiar archivos pendientes al desmontar el componente
  useEffect(() => {
    return () => {
      clearPendingFiles();
    };
  }, [clearPendingFiles]);

  // Initialize form data when blog is loaded
  useEffect(() => {
    if (blog && !isInitialized) {
      // Asegurar que el contenido tenga la estructura correcta de OutputData
      const blogContent = blog.content as OutputData;
      const content: OutputData = {
        blocks: blogContent?.blocks || [],
        time: blogContent?.time || Date.now(),
        version: blogContent?.version || '2.28.2'
      };

      setFormData({
        title: blog.title,
        slug: blog.slug,
        content,
        coverImage: blog.coverImage || '',
        published: blog.published,
      });

      setIsInitialized(true);
    }
  }, [blog, isInitialized]);

  const validateForm = (): boolean => {
    const newErrors: BlogFormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'El slug es requerido';
    }

    if (!formData.content || !formData.content.blocks || formData.content.blocks.length === 0) {
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
      // Solo generar slug automáticamente si no ha sido editado manualmente
      slug: isSlugManuallyEdited ? prev.slug : blogService.generateSlug(title)
    }));
    if (errors.title) {
      setErrors(prev => ({ ...prev, title: undefined }));
    }
  };

  const handleSlugChange = (slug: string) => {
    setIsSlugManuallyEdited(true);
    setFormData(prev => ({
      ...prev,
      slug: blogService.generateSlug(slug)
    }));
    if (errors.slug) {
      setErrors(prev => ({ ...prev, slug: undefined }));
    }
  };

  // Función eliminada: handleContentChange ya no es necesaria
  // El contenido se obtiene directamente del editor cuando se necesita

  const handleCoverImageChange = (coverImage: string) => {
    setFormData(prev => ({ ...prev, coverImage }));
    if (errors.coverImage) {
      setErrors(prev => ({ ...prev, coverImage: undefined }));
    }
  };

  const handleCoverImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen');
      return;
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande. Máximo 10MB.');
      return;
    }

    // Remover archivo anterior si existe
    if (formData.coverImageFileId) {
      removePendingFile(formData.coverImageFileId);
    }

    // Agregar archivo para subida diferida
    const { id, preview } = addPendingFile(file, 'image');

    setFormData(prev => ({
      ...prev,
      coverImage: preview,
      coverImageFileId: id
    }));

    if (errors.coverImage) {
      setErrors(prev => ({ ...prev, coverImage: undefined }));
    }

    toast.success('Imagen seleccionada. Se subirá al guardar el blog.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Obtener contenido actual del editor
      if (editorRef.current) {
        const editorData = await editorRef.current.getData();
        const updatedFormData = { ...formData, content: editorData };

        // Validar con el contenido actualizado
        const newErrors: BlogFormErrors = {};

        if (!updatedFormData.title.trim()) {
          newErrors.title = 'El título es requerido';
        }

        if (!updatedFormData.slug.trim()) {
          newErrors.slug = 'El slug es requerido';
        }

        if (!updatedFormData.content || !updatedFormData.content.blocks || updatedFormData.content.blocks.length === 0) {
          newErrors.content = 'El contenido es requerido';
        }

        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          toast.error('Por favor corrige los errores en el formulario');
          return;
        }

        // Subir archivos pendientes a Cloudinary
        const uploadedUrls = await uploadAllPendingFiles('blog-images');

        // Procesar imagen de portada
        let finalCoverImage = updatedFormData.coverImage;
        if (updatedFormData.coverImageFileId && uploadedUrls[updatedFormData.coverImageFileId]) {
          finalCoverImage = uploadedUrls[updatedFormData.coverImageFileId];
        }

        // Procesar contenido del editor para reemplazar URLs temporales
        const processedContent = processEditorContent(updatedFormData.content, uploadedUrls);

        await updateBlogMutation.mutateAsync({
          id: blogId,
          data: {
            title: updatedFormData.title,
            slug: updatedFormData.slug,
            content: processedContent,
            coverImage: finalCoverImage || undefined,
            published: updatedFormData.published,
          }
        });

        toast.success('Blog actualizado exitosamente');
        router.push('/adminboard?section=blogs');
      }
    } catch (error) {
      console.error('Error updating blog:', error);
      toast.error('Error al actualizar el blog');
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

  const [previewContent, setPreviewContent] = useState<OutputData | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const updatePreviewContent = async () => {
    try {
      setIsLoadingPreview(true);
      // Obtener contenido actual del editor para la vista previa
      let contentToRender = formData.content;

      if (editorRef.current) {
        contentToRender = await editorRef.current.getData();
      }

      console.log('Preview - contentToRender:', contentToRender);
      console.log('Preview - blocks length:', contentToRender?.blocks?.length || 0);

      setPreviewContent(contentToRender);
    } catch (error) {
      console.error('Error rendering preview:', error);
      setPreviewContent(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const renderPreview = () => {
    if (isLoadingPreview) {
      return <p className="text-gray-500">Cargando vista previa...</p>;
    }

    if (!previewContent || !previewContent.blocks || previewContent.blocks.length === 0) {
      return <p className="text-gray-500">No hay contenido para mostrar</p>;
    }

    return (
      <BlogRenderer content={previewContent} />
    );
  };

  // Actualizar preview cuando se cambie a modo preview
  useEffect(() => {
    if (isPreviewMode) {
      updatePreviewContent();
    }
  }, [isPreviewMode]);

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
    <div className="min-h-scree">
      {/* Header */}
      <div className="border-b sticky top-0 z-10">
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
                  <div className="space-y-3">
                    {/* URL Input */}
                    <Input
                      id="coverImage"
                      value={formData.coverImage}
                      onChange={(e) => handleCoverImageChange(e.target.value)}
                      placeholder="https://ejemplo.com/imagen.jpg"
                      className={errors.coverImage ? 'border-red-500' : ''}
                    />
                    <p className="text-sm text-gray-600">
                      URL de la imagen de portada (opcional)
                    </p>

                    {/* File Upload */}
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCoverImageFileChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Subir desde equipo
                      </Button>
                      <span className="text-sm text-gray-500">o ingresa una URL arriba</span>
                    </div>
                  </div>
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
                  Usa el editor para crear contenido rico con imágenes, títulos, listas y más.
                </p>
              </CardHeader>
              <CardContent>
                <BlogEditor
                  ref={editorRef}
                  initialData={formData.content}
                  deferredUpload={{
                    addPendingFile,
                    uploadAllPendingFiles
                  }}
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