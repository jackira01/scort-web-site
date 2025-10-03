'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  Trash2,
  Save,
  X,
  AlertCircle,
  FileText,
  Type,
  Image as ImageIcon,
  Upload,
  Crop,
  Eye
} from 'lucide-react';
import { INews, INewsContent } from '@/types/news.types';
import { ImageCropModal } from '@/components/ImageCropModal';
import { CloudinaryImage } from '@/components/CloudinaryImage';
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from '@/components/ui/dialog';

import { useCreateNews, useUpdateNews } from '@/hooks/use-news';
import { News, CreateNewsRequest, UpdateNewsRequest } from '@/types/news.types';

interface NewsFormProps {
  isOpen: boolean;
  onClose: () => void;
  news?: News | null;
  mode: 'create' | 'edit';
}

export function NewsForm({ isOpen, onClose, news, mode }: NewsFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<INewsContent[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Estados para imagen/banner
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [currentImageToCrop, setCurrentImageToCrop] = useState<File | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const createNewsMutation = useCreateNews();
  const updateNewsMutation = useUpdateNews();

  // Reset form when modal opens/closes or news changes
  useEffect(() => {
    if (mode === 'edit' && news) {
      setTitle(news.title);
      setContent(news.content || []);
      setIsPublished(news.published);
      setBannerImage(news.bannerImage || null);
    } else {
      // Reset form for create mode
      setTitle('');
      setContent([]);
      setIsPublished(false);
      setBannerImage(null);
      setBannerFile(null);
    }
    setErrors({});
  }, [mode, news, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'El título es requerido';
    }

    if (content.length === 0) {
      newErrors.content = 'Debe agregar al menos un elemento de contenido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Función para manejar la selección de imagen
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setErrors({ ...errors, banner: 'Solo se permiten archivos de imagen' });
      return;
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrors({ ...errors, banner: 'El archivo es demasiado grande. Máximo 10MB.' });
      return;
    }

    setCurrentImageToCrop(file);
    setCropModalOpen(true);
  };

  // Función para manejar el crop completado
  const handleCropComplete = async (croppedBlob: Blob, croppedUrl: string) => {
    try {
      setIsProcessingImage(true);

      // Crear archivo desde el blob
      const processedFile = new File([croppedBlob], currentImageToCrop?.name || 'banner.jpg', {
        type: croppedBlob.type,
        lastModified: Date.now(),
      });

      setBannerFile(processedFile);
      setBannerImage(croppedUrl);

      // Limpiar errores de banner
      const newErrors = { ...errors };
      delete newErrors.banner;
      setErrors(newErrors);

    } catch (error) {
      setErrors({ ...errors, banner: 'Error al procesar la imagen' });
    } finally {
      setIsProcessingImage(false);
      setCropModalOpen(false);
      setCurrentImageToCrop(null);
    }
  };

  // Función para remover imagen
  const handleRemoveImage = () => {
    setBannerImage(null);
    setBannerFile(null);
    const newErrors = { ...errors };
    delete newErrors.banner;
    setErrors(newErrors);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      // Convertir INewsContent[] a string[] para compatibilidad con el backend
      const contentStrings = content.map(item => item.content);
      
      const newsData: CreateNewsRequest | UpdateNewsRequest = {
        title: title.trim(),
        content: contentStrings,
        published: isPublished,
        bannerImage: bannerImage || undefined,
      };

      if (mode === 'create') {
        await createNewsMutation.mutateAsync(newsData as CreateNewsRequest);
      } else if (news?.id) {
        await updateNewsMutation.mutateAsync({
          id: news.id,
          ...newsData as UpdateNewsRequest,
        });
      }

      onClose();
    } catch (error) {
      console.error('Error saving news:', error);
    }
  };

  // Función para agregar contenido de texto
  const addContentItem = (type: 'text') => {
    const newItem: INewsContent = {
      id: Date.now().toString(),
      type,
      content: '',
      order: content.length,
    };
    setContent([...content, newItem]);
  };

  // Función para actualizar contenido
  const updateContentItem = (id: string, newContent: string) => {
    setContent(content.map(item =>
      item.id === id ? { ...item, content: newContent } : item
    ));
  };

  // Función para eliminar contenido
  const removeContentItem = (id: string) => {
    setContent(content.filter(item => item.id !== id));
  };

  const isLoading = createNewsMutation.isPending || updateNewsMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {mode === 'create' ? 'Crear Nueva Noticia' : 'Editar Noticia'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Campo de título */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Título de la noticia
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ingrese el título de la noticia..."
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Campo de imagen/banner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Imagen/Banner (16:9)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!bannerImage ? (
                <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center hover:border-purple-500 transition-colors duration-200">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="banner-upload"
                  />
                  <label htmlFor="banner-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Seleccionar imagen para banner</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG, WEBP - Máximo 10MB
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
                      📐 Se recortará automáticamente a formato 16:9
                    </p>
                  </label>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative group">
                    <CloudinaryImage
                      src={bannerImage}
                      alt="Banner de la noticia"
                      width={640}
                      height={360}
                      className="w-full rounded-lg border"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          if (bannerFile) {
                            setCurrentImageToCrop(bannerFile);
                            setCropModalOpen(true);
                          }
                        }}
                        disabled={!bannerFile}
                      >
                        <Crop className="h-4 w-4 mr-1" />
                        Recortar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleRemoveImage}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                  <Badge variant="outline" className="w-fit">
                    <Eye className="h-3 w-3 mr-1" />
                    Imagen cargada - Formato 16:9
                  </Badge>
                </div>
              )}
              {errors.banner && (
                <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700 dark:text-red-300">
                    {errors.banner}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Sección de contenido */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Contenido de la noticia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {content.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hay contenido agregado</p>
                  <p className="text-sm">Agregue elementos de texto para crear la noticia</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {content.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">
                          Texto #{index + 1}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeContentItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Textarea
                        value={item.content}
                        onChange={(e) => updateContentItem(item.id, e.target.value)}
                        placeholder="Escriba el contenido del párrafo..."
                        rows={4}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Botones para agregar contenido */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addContentItem('text')}
                  className="w-full"
                >
                  <Type className="h-4 w-4 mr-2" />
                  Agregar Texto
                </Button>
              </div>

              {errors.content && (
                <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700 dark:text-red-300">
                    {errors.content}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Estado de publicación */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-medium">Estado de publicación</Label>
              <p className="text-sm text-muted-foreground">
                {isPublished ? 'La noticia será visible para todos los usuarios' : 'La noticia permanecerá como borrador'}
              </p>
            </div>
            <Switch
              checked={isPublished}
              onCheckedChange={setIsPublished}
            />
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createNewsMutation.isPending || updateNewsMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {createNewsMutation.isPending || updateNewsMutation.isPending
                ? 'Guardando...'
                : mode === 'create' ? 'Crear Noticia' : 'Actualizar Noticia'
              }
            </Button>
          </div>
        </div>

        {/* Modal de recorte de imagen */}
        {currentImageToCrop && (
          <ImageCropModal
            isOpen={cropModalOpen}
            onClose={() => {
              setCropModalOpen(false);
              setCurrentImageToCrop(null);
            }}
            imageSrc={URL.createObjectURL(currentImageToCrop)}
            onCropComplete={handleCropComplete}
            fileName={currentImageToCrop.name}
            aspectRatio={16 / 9} // Formato 16:9 para banners
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

export default NewsForm;