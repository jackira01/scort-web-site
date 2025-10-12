'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Eye, Upload } from 'lucide-react';
import { useCreateBlog } from '../../../../src/hooks/use-blogs';
import { blogService } from '../../../../src/services/blog.service';
import { useDeferredUpload } from '../../../../src/hooks/use-deferred-upload';
import { Button } from '../../../../src/components/ui/button';
import { Input } from '../../../../src/components/ui/input';
import { Label } from '../../../../src/components/ui/label';
import { Switch } from '../../../../src/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../src/components/ui/card';
import { Badge } from '../../../../src/components/ui/badge';
import { Separator } from '../../../../src/components/ui/separator';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

const BlogEditor = dynamic(() => import('../../../../src/components/blog/BlogEditor'), {
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

import { BlogEditorRef } from '../../../../src/components/blog/BlogEditor';
import BlogRenderer from '../../../../src/components/blog/BlogRenderer';
import type { OutputData } from '@editorjs/editorjs';

interface BlogFormData {
  title: string;
  slug: string;
  content: OutputData;
  coverImage: string;
  coverImageFileId?: string; // ID del archivo pendiente
  published: boolean;
}

interface BlogFormErrors {
  title?: string;
  slug?: string;
  content?: string;
  coverImage?: string;
  published?: string;
}

const initialFormData: BlogFormData = {
  title: '',
  slug: '',
  content: { blocks: [], time: Date.now(), version: '2.28.2' },
  coverImage: '',
  coverImageFileId: undefined,
  published: false,
};

export default function CreateBlogPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<BlogEditorRef>(null);
  const [formData, setFormData] = useState<BlogFormData>(initialFormData);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [errors, setErrors] = useState<BlogFormErrors>({});
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  const createBlogMutation = useCreateBlog();
  const { addPendingFile, removePendingFile, uploadAllPendingFiles, getPreviewUrl, clearPendingFiles, processEditorContent } = useDeferredUpload();

  // Limpiar archivos pendientes al desmontar el componente
  useEffect(() => {
    return () => {
      clearPendingFiles();
    };
  }, [clearPendingFiles]);

  const validateForm = (): boolean => {
    const newErrors: BlogFormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'El slug es requerido';
    }

    if (!formData.content.blocks || formData.content.blocks.length === 0) {
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
      let currentContent = formData.content;
      if (editorRef.current) {
        currentContent = await editorRef.current.getData();
      }

      const updatedFormData = { ...formData, content: currentContent };

      // Validar con el contenido actualizado
      const newErrors: BlogFormErrors = {};

      if (!updatedFormData.title.trim()) {
        newErrors.title = 'El título es requerido';
      }

      if (!updatedFormData.slug.trim()) {
        newErrors.slug = 'El slug es requerido';
      }

      if (!updatedFormData.content.blocks || updatedFormData.content.blocks.length === 0) {
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

      await createBlogMutation.mutateAsync({
        title: updatedFormData.title,
        slug: updatedFormData.slug,
        content: processedContent,
        coverImage: finalCoverImage || undefined,
        published: updatedFormData.published,
      });

      toast.success('Blog creado exitosamente');
      router.push('/adminboard?section=blogs');
    } catch (error) {
      console.error('Error creating blog:', error);
      toast.error('Error al guardar el blog');
    }
  };

  const handleSaveDraft = async () => {
    if (!formData.title.trim()) {
      toast.error('El título es requerido para guardar el borrador');
      return;
    }

    try {
      // Obtener contenido actual del editor
      let currentContent = formData.content;
      if (editorRef.current) {
        currentContent = await editorRef.current.getData();
      }

      // Subir archivos pendientes a Cloudinary
      const uploadedUrls = await uploadAllPendingFiles('blog-images');

      // Procesar imagen de portada
      let finalCoverImage = formData.coverImage;
      if (formData.coverImageFileId && uploadedUrls[formData.coverImageFileId]) {
        finalCoverImage = uploadedUrls[formData.coverImageFileId];
      }

      // Procesar contenido del editor para reemplazar URLs temporales
      const processedContent = processEditorContent(currentContent, uploadedUrls);

      await createBlogMutation.mutateAsync({
        title: formData.title,
        slug: formData.slug || blogService.generateSlug(formData.title),
        content: processedContent,
        coverImage: finalCoverImage || undefined,
        published: false,
      });

      toast.success('Borrador guardado exitosamente');
      router.push('/adminboard?section=blogs');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Error al guardar el borrador');
    }
  };

  const [previewContent, setPreviewContent] = useState<OutputData | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const updatePreviewContent = async () => {
    try {
      setIsLoadingPreview(true);
      // Obtener contenido actual del editor
      let currentContent = formData.content;
      if (editorRef.current) {
        currentContent = await editorRef.current.getData();
      }

      console.log('Preview - currentContent:', currentContent);
      console.log('Preview - blocks length:', currentContent?.blocks?.length || 0);

      setPreviewContent(currentContent);
    } catch (error) {
      console.error('Error getting editor content for preview:', error);
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
              <h1 className="text-xl font-semibold text-gray-900">Crear Nuevo Blog</h1>
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
                onClick={handleSaveDraft}
                disabled={createBlogMutation.isPending}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Guardar Borrador
              </Button>

              <Button
                type="submit"
                form="blog-form"
                disabled={createBlogMutation.isPending}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {formData.published ? 'Publicar' : 'Crear'}
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
                    {formData.published ? "Se publicará" : "Borrador"}
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
                    {/* File Upload */}
                    <div>
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
                        className="w-full flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Subir imagen desde mi equipo
                      </Button>
                    </div>

                    {/* URL Input */}
                    <div>
                      <Input
                        id="coverImage"
                        value={formData.coverImage}
                        onChange={(e) => handleCoverImageChange(e.target.value)}
                        placeholder="O ingresa una URL: https://ejemplo.com/imagen.jpg"
                        className={errors.coverImage ? 'border-red-500' : ''}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Sube una imagen desde tu equipo o ingresa una URL (opcional)
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
                    Publicar inmediatamente
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Content Section */}
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