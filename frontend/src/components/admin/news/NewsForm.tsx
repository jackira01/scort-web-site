'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCreateNews, useUpdateNews } from '@/hooks/use-news';
import { News, CreateNewsRequest, UpdateNewsRequest } from '@/types/news.types';

interface NewsFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'create' | 'edit';
  news?: News | null;
}

interface FormData {
  title: string;
  content: string[];
  published: boolean;
}

const NewsForm = ({ isOpen, onClose, onSuccess, mode, news }: NewsFormProps) => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    content: [''],
    published: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createNewsMutation = useCreateNews();
  const updateNewsMutation = useUpdateNews();

  // Reset form when modal opens/closes or news changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && news) {
        setFormData({
          title: news.title,
          content: news.content.length > 0 ? news.content : [''],
          published: news.published,
        });
      } else {
        setFormData({
          title: '',
          content: [''],
          published: true,
        });
      }
      setErrors({});
    }
  }, [isOpen, mode, news]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate title
    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'El título debe tener al menos 3 caracteres';
    } else if (formData.title.trim().length > 200) {
      newErrors.title = 'El título no puede exceder 200 caracteres';
    }

    // Validate content
    const validContent = formData.content.filter(item => item.trim().length > 0);
    if (validContent.length === 0) {
      newErrors.content = 'Debe incluir al menos un elemento de contenido';
    }

    // Validate individual content items
    const invalidItems = formData.content.some((item, index) => {
      if (item.trim().length > 0 && item.trim().length > 500) {
        newErrors[`content_${index}`] = 'Cada elemento no puede exceder 500 caracteres';
        return true;
      }
      return false;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Clean content (remove empty items)
      const cleanContent = formData.content
        .map(item => item.trim())
        .filter(item => item.length > 0);

      if (mode === 'create') {
        const createData: CreateNewsRequest = {
          title: formData.title.trim(),
          content: cleanContent,
          published: formData.published,
        };
        await createNewsMutation.mutateAsync(createData);
      } else if (mode === 'edit' && news) {
        const updateData: UpdateNewsRequest = {
          _id: news._id,
          title: formData.title.trim(),
          content: cleanContent,
          published: formData.published,
        };
        await updateNewsMutation.mutateAsync({ id: news._id, data: updateData });
      }

      onSuccess();
    } catch (error) {
      console.error('Error al guardar noticia:', error);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleContentChange = (index: number, value: string) => {
    const newContent = [...formData.content];
    newContent[index] = value;
    setFormData(prev => ({ ...prev, content: newContent }));
    
    // Clear errors
    if (errors.content) {
      setErrors(prev => ({ ...prev, content: '' }));
    }
    if (errors[`content_${index}`]) {
      setErrors(prev => ({ ...prev, [`content_${index}`]: '' }));
    }
  };

  const addContentItem = () => {
    setFormData(prev => ({
      ...prev,
      content: [...prev.content, '']
    }));
  };

  const removeContentItem = (index: number) => {
    if (formData.content.length > 1) {
      const newContent = formData.content.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, content: newContent }));
    }
  };

  const isLoading = createNewsMutation.isPending || updateNewsMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Crear Nueva Noticia' : 'Editar Noticia'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Ingresa el título de la noticia"
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.title.length}/200 caracteres
            </p>
          </div>

          <Separator />

          {/* Content */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Contenido *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addContentItem}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar elemento
              </Button>
            </div>
            
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content}</p>
            )}

            <div className="space-y-3">
              {formData.content.map((item, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        Elemento {index + 1}
                      </Label>
                      {formData.content.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeContentItem(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <Textarea
                      value={item}
                      onChange={(e) => handleContentChange(index, e.target.value)}
                      placeholder="Describe un cambio o actualización..."
                      className={`min-h-[80px] ${errors[`content_${index}`] ? 'border-destructive' : ''}`}
                    />
                    {errors[`content_${index}`] && (
                      <p className="text-sm text-destructive">{errors[`content_${index}`]}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {item.length}/500 caracteres
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Published */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Estado de publicación</Label>
              <p className="text-sm text-muted-foreground">
                {formData.published 
                  ? 'La noticia será visible para todos los usuarios'
                  : 'La noticia se guardará como borrador'
                }
              </p>
            </div>
            <Switch
              checked={formData.published}
              onCheckedChange={(checked) => handleInputChange('published', checked)}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading 
                ? (mode === 'create' ? 'Creando...' : 'Guardando...') 
                : (mode === 'create' ? 'Crear Noticia' : 'Guardar Cambios')
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewsForm;