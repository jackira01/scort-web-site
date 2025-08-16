'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, Save, X } from 'lucide-react';
import { 
  useAttributeGroups, 
  useCreateAttributeGroup, 
  useUpdateVariant,
  useDeleteAttributeGroup,
  useAddVariant,
  useRemoveVariant,
  useUpdateGroup
} from '@/hooks/use-attribute-groups';
import type { IAttributeGroup, CreateAttributeGroupInput, Variant } from '@/types/attribute-group.types';

interface EditingGroup {
  _id?: string;
  name: string;
  key: string;
  variants: { label: string; value: string }[];
}

export const AttributeGroupsAdmin: React.FC = () => {
  const { data: attributeGroups, isLoading, error } = useAttributeGroups();
  const createMutation = useCreateAttributeGroup();
  const updateMutation = useUpdateVariant();
  const deleteGroupMutation = useDeleteAttributeGroup();
  const addVariantMutation = useAddVariant();
  const removeVariantMutation = useRemoveVariant();
  const updateGroupMutation = useUpdateGroup();
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingGroup, setEditingGroup] = useState<EditingGroup | null>(null);
  const [editingGroupData, setEditingGroupData] = useState<{ name: string; key: string } | null>(null);
  const [addingVariantTo, setAddingVariantTo] = useState<string | null>(null);
  const [newGroup, setNewGroup] = useState<CreateAttributeGroupInput>({
    name: '',
    key: '',
    variants: [{ label: '', value: '' }]
  });
  const [newVariantForGroup, setNewVariantForGroup] = useState({ label: '', value: '' });

  const handleCreateGroup = async () => {
    if (!newGroup.name || !newGroup.key || newGroup.variants.some(v => !v.label || !v.value)) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      await createMutation.mutateAsync(newGroup);
      setNewGroup({ name: '', key: '', variants: [{ label: '', value: '' }] });
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating attribute group:', error);
      alert('Error al crear el grupo de atributos');
    }
  };

  const handleUpdateVariant = async (groupId: string, variantIndex: number, newValue: string, active: boolean) => {
    try {
      await updateMutation.mutateAsync({
        groupId,
        variantIndex,
        newValue,
        active
      });
    } catch (error) {
      console.error('Error updating variant:', error);
      alert('Error al actualizar la variante');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este grupo?')) return;
    
    try {
      await deleteGroupMutation.mutateAsync(groupId);
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Error al eliminar el grupo');
    }
  };

  const handleUpdateGroup = async (groupId: string) => {
    if (!editingGroupData?.name || !editingGroupData?.key) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      await updateGroupMutation.mutateAsync({
        groupId,
        data: editingGroupData
      });
      setEditingGroup(null);
      setEditingGroupData(null);
    } catch (error) {
      console.error('Error updating group:', error);
      alert('Error al actualizar el grupo');
    }
  };

  const handleAddVariantToGroup = async (groupId: string) => {
    if (!newVariantForGroup.label || !newVariantForGroup.value) {
      alert('Por favor completa todos los campos de la variante');
      return;
    }

    try {
      await addVariantMutation.mutateAsync({
        groupId,
        data: newVariantForGroup
      });
      setNewVariantForGroup({ label: '', value: '' });
      setAddingVariantTo(null);
    } catch (error) {
      console.error('Error adding variant:', error);
      alert('Error al agregar la variante');
    }
  };

  const handleRemoveVariant = async (groupId: string, variantIndex: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta variante?')) return;
    
    try {
      await removeVariantMutation.mutateAsync({
        groupId,
        data: { variantIndex }
      });
    } catch (error) {
      console.error('Error removing variant:', error);
      alert('Error al eliminar la variante');
    }
  };

  const startEditingGroup = (group: IAttributeGroup) => {
    setEditingGroup({ _id: group._id, name: group.name, key: group.key, variants: group.variants.map(v => ({ label: v.label, value: v.value })) });
    setEditingGroupData({ name: group.name, key: group.key });
  };

  const cancelEditingGroup = () => {
    setEditingGroup(null);
    setEditingGroupData(null);
  };

  const addVariantToNewGroup = () => {
    setNewGroup(prev => ({
      ...prev,
      variants: [...prev.variants, { label: '', value: '' }]
    }));
  };

  const removeVariantFromNewGroup = (index: number) => {
    setNewGroup(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const updateNewGroupVariant = (index: number, field: 'label' | 'value', value: string) => {
    setNewGroup(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === index ? { ...variant, [field]: value } : variant
      )
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Cargando grupos de atributos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-red-500">Error al cargar los grupos de atributos</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Administrar Grupos de Atributos</h2>
        <Button 
          onClick={() => setIsCreating(true)} 
          disabled={isCreating}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Grupo
        </Button>
      </div>

      {/* Formulario para crear nuevo grupo */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Crear Nuevo Grupo de Atributos
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setIsCreating(false);
                  setNewGroup({ name: '', key: '', variants: [{ label: '', value: '' }] });
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Género"
                />
              </div>
              <div>
                <Label htmlFor="key">Clave</Label>
                <Input
                  id="key"
                  value={newGroup.key}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, key: e.target.value }))}
                  placeholder="Ej: gender"
                />
              </div>
            </div>
            
            <div>
              <Label>Variantes</Label>
              <div className="space-y-2 mt-2">
                {newGroup.variants.map((variant, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      placeholder="Etiqueta (Ej: Masculino)"
                      value={variant.label}
                      onChange={(e) => updateNewGroupVariant(index, 'label', e.target.value)}
                    />
                    <Input
                      placeholder="Valor (Ej: male)"
                      value={variant.value}
                      onChange={(e) => updateNewGroupVariant(index, 'value', e.target.value)}
                    />
                    {newGroup.variants.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVariantFromNewGroup(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addVariantToNewGroup}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Variante
                </Button>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleCreateGroup}
                disabled={createMutation.isPending}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {createMutation.isPending ? 'Creando...' : 'Crear Grupo'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de grupos existentes */}
      <div className="grid gap-4">
        {attributeGroups?.map((group: IAttributeGroup) => (
            <Card key={group._id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {editingGroup?._id === group._id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editingGroupData?.name || ''}
                        onChange={(e) => setEditingGroupData(prev => prev ? { ...prev, name: e.target.value } : { name: e.target.value, key: '' })}
                        placeholder="Nombre del grupo"
                        className="flex-1"
                      />
                      <Input
                        value={editingGroupData?.key || ''}
                        onChange={(e) => setEditingGroupData(prev => prev ? { ...prev, key: e.target.value } : { name: '', key: e.target.value })}
                        placeholder="Clave del grupo"
                        className="flex-1"
                      />
                      <Button
                        onClick={() => handleUpdateGroup(group._id)}
                        disabled={updateGroupMutation.isPending}
                        size="sm"
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={cancelEditingGroup}
                        size="sm"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div>
                        {group.name}
                        <Badge variant="secondary" className="ml-2">{group.key}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => startEditingGroup(group)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteGroup(group._id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </CardTitle>
              </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Variantes:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {group.variants.map((variant: Variant, index: number) => (
                      <div key={index} className="flex items-center gap-1">
                        <Badge 
                          variant={variant.active !== false ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => handleUpdateVariant(
                            group._id, 
                            index, 
                            variant.value, 
                            !(variant.active !== false)
                          )}
                        >
                          {variant.label} ({variant.value})
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveVariant(group._id, index)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                
                {addingVariantTo === group._id ? (
                  <div className="space-y-2 p-3 border rounded">
                    <Label>Nueva Variante:</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Etiqueta"
                        value={newVariantForGroup.label}
                        onChange={(e) => setNewVariantForGroup(prev => ({ ...prev, label: e.target.value }))}
                      />
                      <Input
                        placeholder="Valor"
                        value={newVariantForGroup.value}
                        onChange={(e) => setNewVariantForGroup(prev => ({ ...prev, value: e.target.value }))}
                      />
                      <Button
                        onClick={() => handleAddVariantToGroup(group._id)}
                        disabled={addVariantMutation.isPending}
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setAddingVariantTo(null);
                          setNewVariantForGroup({ label: '', value: '' });
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAddingVariantTo(group._id)}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Variante
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AttributeGroupsAdmin;