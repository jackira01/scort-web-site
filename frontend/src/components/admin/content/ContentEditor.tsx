'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  ArrowLeft,
  Type,
  List,
  Eye,
  EyeOff,
  GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useContentAdmin } from '@/hooks/use-content';
import { 
  IContentPage, 
  IContentSection, 
  IContentBlock, 
  ContentBlockType,
  UpdateContentPageInput
} from '@/types/content.types';
import Loader from '@/components/Loader';
import toast from 'react-hot-toast';
import WysiwygEditor from './WysiwygEditor';

interface ContentEditorProps {
  pageSlug?: string;
  onBack?: () => void;
}

const ContentEditor = ({ pageSlug, onBack }: ContentEditorProps) => {
  const [page, setPage] = useState<IContentPage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'section' | 'block';
    sectionIndex?: number;
    blockIndex?: number;
  } | null>(null);

  const { 
    updatePage, 
    getPageById,
    getPageBySlugAdmin, 
    loading: actionLoading, 
    error: actionError 
  } = useContentAdmin();

  // Cargar página existente
  useEffect(() => {
    if (pageSlug) {
      loadPage();
    }
  }, [pageSlug]);

  const loadPage = async () => {
    if (!pageSlug) return;
    
    setIsLoading(true);
    try {
      const loadedPage = await getPageBySlugAdmin(pageSlug);
      if (loadedPage) {
        setPage(loadedPage);
      } else {
        toast.error('No se pudo cargar la página');
      }
    } catch (error) {
      toast.error('Error al cargar la página');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!page) return;

    setIsSaving(true);
    try {
      const updateData: UpdateContentPageInput = {
        title: page.title,
        sections: page.sections,
        isActive: page.isActive
      };
      
      const savedPage = await updatePage(page.slug, updateData);

      if (savedPage) {
        toast.success('Página actualizada correctamente');
        setPage(savedPage);
      } else {
        toast.error(actionError || 'Error al guardar la página');
      }
    } catch (error) {
      toast.error('Error al guardar la página');
    } finally {
      setIsSaving(false);
    }
  };

  // Funciones para manejar secciones
  const addSection = () => {
    if (!page) return;
    
    const newSection: IContentSection = {
      title: 'Nueva Sección',
      order: page.sections.length + 1,
      blocks: []
    };
    
    setPage({
      ...page,
      sections: [...page.sections, newSection]
    });
  };

  const updateSection = (sectionIndex: number, updates: Partial<IContentSection>) => {
    if (!page) return;
    
    const updatedSections = [...page.sections];
    updatedSections[sectionIndex] = { ...updatedSections[sectionIndex], ...updates };
    
    setPage({
      ...page,
      sections: updatedSections
    });
  };

  const moveSection = (sectionIndex: number, direction: 'up' | 'down') => {
    if (!page) return;
    
    const sections = [...page.sections];
    const targetIndex = direction === 'up' ? sectionIndex - 1 : sectionIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    
    // Intercambiar secciones
    [sections[sectionIndex], sections[targetIndex]] = [sections[targetIndex], sections[sectionIndex]];
    
    // Actualizar orden
    sections.forEach((section, index) => {
      section.order = index + 1;
    });
    
    setPage({
      ...page,
      sections
    });
  };

  const deleteSection = (sectionIndex: number) => {
    setItemToDelete({ type: 'section', sectionIndex });
    setIsDeleteDialogOpen(true);
  };

  // Funciones para manejar bloques
  const addBlock = (sectionIndex: number) => {
    if (!page) return;
    
    const newBlock: IContentBlock = {
      type: ContentBlockType.PARAGRAPH,
      value: ''
    };
    
    const updatedSections = [...page.sections];
    updatedSections[sectionIndex].blocks = [
      ...(updatedSections[sectionIndex].blocks || []),
      newBlock
    ];
    
    setPage({
      ...page,
      sections: updatedSections
    });
  };

  const updateBlock = (sectionIndex: number, blockIndex: number, updates: Partial<IContentBlock>) => {
    if (!page) return;
    
    const updatedSections = [...page.sections];
    const blocks = [...(updatedSections[sectionIndex].blocks || [])];
    blocks[blockIndex] = { ...blocks[blockIndex], ...updates };
    updatedSections[sectionIndex].blocks = blocks;
    
    setPage({
      ...page,
      sections: updatedSections
    });
  };

  const moveBlock = (sectionIndex: number, blockIndex: number, direction: 'up' | 'down') => {
    if (!page) return;
    
    const updatedSections = [...page.sections];
    const blocks = [...(updatedSections[sectionIndex].blocks || [])];
    const targetIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    
    // Intercambiar bloques
    [blocks[blockIndex], blocks[targetIndex]] = [blocks[targetIndex], blocks[blockIndex]];
    updatedSections[sectionIndex].blocks = blocks;
    
    setPage({
      ...page,
      sections: updatedSections
    });
  };

  const deleteBlock = (sectionIndex: number, blockIndex: number) => {
    setItemToDelete({ type: 'block', sectionIndex, blockIndex });
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!page || !itemToDelete) return;
    
    if (itemToDelete.type === 'section' && itemToDelete.sectionIndex !== undefined) {
      const updatedSections = page.sections.filter((_, index) => index !== itemToDelete.sectionIndex);
      // Reordenar
      updatedSections.forEach((section, index) => {
        section.order = index + 1;
      });
      
      setPage({
        ...page,
        sections: updatedSections
      });
    } else if (itemToDelete.type === 'block' && itemToDelete.sectionIndex !== undefined && itemToDelete.blockIndex !== undefined) {
      const updatedSections = [...page.sections];
      const blocks = [...(updatedSections[itemToDelete.sectionIndex].blocks || [])];
      blocks.splice(itemToDelete.blockIndex, 1);
      updatedSections[itemToDelete.sectionIndex].blocks = blocks;
      
      setPage({
        ...page,
        sections: updatedSections
      });
    }
    
    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  // Renderizar editor de bloque según tipo
  const renderBlockEditor = (block: IContentBlock, sectionIndex: number, blockIndex: number) => {
    switch (block.type) {
      case ContentBlockType.PARAGRAPH:
        return (
          <WysiwygEditor
            value={block.value as string || ''}
            onChange={(value) => updateBlock(sectionIndex, blockIndex, { value })}
            placeholder="Escribe el contenido del párrafo..."
            className="min-h-[200px]"
          />
        );
      
      case ContentBlockType.LIST:
        const listItems = Array.isArray(block.value) ? block.value : [];
        return (
          <div className="space-y-2">
            {listItems.map((item, itemIndex) => (
              <div key={itemIndex} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => {
                    const newItems = [...listItems];
                    newItems[itemIndex] = e.target.value;
                    updateBlock(sectionIndex, blockIndex, { value: newItems });
                  }}
                  placeholder={`Item ${itemIndex + 1}`}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newItems = listItems.filter((_, i) => i !== itemIndex);
                    updateBlock(sectionIndex, blockIndex, { value: newItems });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newItems = [...listItems, ''];
                updateBlock(sectionIndex, blockIndex, { value: newItems });
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar item
            </Button>
          </div>
        );
      
      default:
        return (
          <Input
            value={block.value as string || ''}
            onChange={(e) => updateBlock(sectionIndex, blockIndex, { value: e.target.value })}
            placeholder="Contenido del bloque"
          />
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">No se pudo cargar la página</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Editar: {page.title}</h1>
            <p className="text-muted-foreground">/{page.slug}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="active-switch">Activo</Label>
            <Switch
              id="active-switch"
              checked={page.isActive}
              onCheckedChange={(checked) => setPage({ ...page, isActive: checked })}
            />
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Título de la página */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la página</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="page-title">Título de la página</Label>
              <Input
                id="page-title"
                value={page.title}
                onChange={(e) => setPage({ ...page, title: e.target.value })}
                placeholder="Título de la página"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Secciones */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Secciones</h2>
          <Button onClick={addSection}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar nueva sección
          </Button>
        </div>

        {page.sections.map((section, sectionIndex) => (
          <Card key={sectionIndex} className="border-l-4 border-l-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline">Sección {section.order}</Badge>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveSection(sectionIndex, 'up')}
                    disabled={sectionIndex === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveSection(sectionIndex, 'down')}
                    disabled={sectionIndex === page.sections.length - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSection(sectionIndex)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor={`section-title-${sectionIndex}`}>Título de la sección</Label>
                <Input
                  id={`section-title-${sectionIndex}`}
                  value={section.title}
                  onChange={(e) => updateSection(sectionIndex, { title: e.target.value })}
                  placeholder="Título de la sección"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Bloques</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addBlock(sectionIndex)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar bloque
                  </Button>
                </div>

                {section.blocks?.map((block, blockIndex) => (
                  <Card key={blockIndex} className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Select
                              value={block.type}
                              onValueChange={(value) => 
                                updateBlock(sectionIndex, blockIndex, { 
                                  type: value as ContentBlockType,
                                  value: value === ContentBlockType.LIST ? [] : ''
                                })
                              }
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={ContentBlockType.PARAGRAPH}>
                                  <div className="flex items-center">
                                    <Type className="h-4 w-4 mr-2" />
                                    Párrafo
                                  </div>
                                </SelectItem>
                                <SelectItem value={ContentBlockType.LIST}>
                                  <div className="flex items-center">
                                    <List className="h-4 w-4 mr-2" />
                                    Lista
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveBlock(sectionIndex, blockIndex, 'up')}
                              disabled={blockIndex === 0}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveBlock(sectionIndex, blockIndex, 'down')}
                              disabled={blockIndex === (section.blocks?.length || 0) - 1}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteBlock(sectionIndex, blockIndex)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {renderBlockEditor(block, sectionIndex, blockIndex)}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {(!section.blocks || section.blocks.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No hay bloques en esta sección</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock(sectionIndex)}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar primer bloque
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {page.sections.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No hay secciones
            </h3>
            <p className="text-muted-foreground mb-4">
              Comienza agregando tu primera sección de contenido
            </p>
            <Button onClick={addSection}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar primera sección
            </Button>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {itemToDelete?.type === 'section' ? 'sección' : 'bloque'}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente {itemToDelete?.type === 'section' ? 'la sección y todos sus bloques' : 'el bloque'}.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ContentEditor;