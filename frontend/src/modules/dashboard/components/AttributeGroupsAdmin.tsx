'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, Save, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
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

interface EditingVariant {
  groupId: string;
  variantValue: string;  // El value original de la variante
  label: string;
  value: string;
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
  const [editingVariant, setEditingVariant] = useState<EditingVariant | null>(null);
  const [addingVariantTo, setAddingVariantTo] = useState<string | null>(null);
  const [newGroup, setNewGroup] = useState<CreateAttributeGroupInput>({
    name: '',
    key: '',
    variants: [{ label: '', value: '' }]
  });
  const [newVariantForGroup, setNewVariantForGroup] = useState({ label: '', value: '' });

  const handleCreateGroup = async () => {
    if (!newGroup.name || !newGroup.key || newGroup.variants.some(v => !v.label || !v.value)) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    try {
      await createMutation.mutateAsync(newGroup);
      setNewGroup({ name: '', key: '', variants: [{ label: '', value: '' }] });
      setIsCreating(false);
      toast.success('Grupo creado exitosamente');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Error al crear el grupo de atributos';
      toast.error(errorMessage);
    }
  };

  const handleUpdateVariant = async (groupId: string, variantValue: string, newValue: string, active: boolean) => {
    try {
      await updateMutation.mutateAsync({
        groupId,
        variantValue,
        newValue,
        active
      });
      toast.success('Variante actualizada exitosamente');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Error al actualizar la variante';
      toast.error(errorMessage);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este grupo?')) return;

    try {
      await deleteGroupMutation.mutateAsync(groupId);
      toast.success('Grupo eliminado exitosamente');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Error al eliminar el grupo';
      toast.error(errorMessage);
    }
  };

  const handleUpdateGroup = async (groupId: string) => {
    if (!editingGroupData?.name || !editingGroupData?.key) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    try {
      await updateGroupMutation.mutateAsync({
        groupId,
        data: editingGroupData
      });
      setEditingGroup(null);
      setEditingGroupData(null);
      toast.success('Grupo actualizado exitosamente');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Error al actualizar el grupo';
      toast.error(errorMessage);
    }
  };

  const handleAddVariantToGroup = async (groupId: string) => {
    if (!newVariantForGroup.label || !newVariantForGroup.value) {
      toast.error('Por favor completa todos los campos de la variante');
      return;
    }

    try {
      await addVariantMutation.mutateAsync({
        groupId,
        data: newVariantForGroup
      });
      setNewVariantForGroup({ label: '', value: '' });
      setAddingVariantTo(null);
      toast.success('Variante agregada exitosamente');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Error al agregar la variante';
      toast.error(errorMessage);
    }
  };

  const handleRemoveVariant = async (groupId: string, variantValue: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta variante?')) return;

    console.log(`🗑️ Eliminando variante con value "${variantValue}" del grupo ${groupId}`);

    try {
      await removeVariantMutation.mutateAsync({
        groupId,
        data: { variantValue }
      });
      toast.success('Variante eliminada exitosamente');
    } catch (error: any) {
      console.error('Error al eliminar la variante:', error);
      const errorMessage = error?.response?.data?.message || 'Error al eliminar la variante';
      toast.error(errorMessage);
    }
  };

  const startEditingVariant = (groupId: string, variant: Variant) => {
    setEditingVariant({
      groupId,
      variantValue: variant.value,  // Guardar el value original
      label: variant.label,
      value: variant.value
    });
  };

  const cancelEditingVariant = () => {
    setEditingVariant(null);
  };

  const handleSaveVariantEdit = async () => {
    if (!editingVariant) return;

    if (!editingVariant.label || !editingVariant.value) {
      alert('Por favor completa todos los campos');
      return;
    }

    console.log(`✏️ Actualizando variante "${editingVariant.variantValue}" del grupo ${editingVariant.groupId}`);

    try {
      // Usar updateVariant para actualizar directamente por value
      await updateMutation.mutateAsync({
        groupId: editingVariant.groupId,
        variantValue: editingVariant.variantValue,  // Value original para buscar
        newLabel: editingVariant.label,
        newValue: editingVariant.value,  // Nuevo value (puede ser el mismo o diferente)
        active: true
      });

      setEditingVariant(null);
    } catch (error) {
      console.error('Error al actualizar la variante:', error);
      alert('Error al actualizar la variante');
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
                    {group.variants.map((variant: Variant, index: number) => {
                      const isEditing = editingVariant?.groupId === group._id && editingVariant?.variantValue === variant.value;
                      const uniqueKey = `${group._id}-${variant.value}-${index}`;

                      return (
                        <div
                          key={uniqueKey}
                          className="relative group/variant border rounded-md p-2 bg-background hover:bg-accent/50 transition-colors"
                        >
                          {isEditing ? (
                            <div className="flex items-center gap-2 min-w-[300px]">
                              <Input
                                value={editingVariant.label}
                                onChange={(e) => setEditingVariant({ ...editingVariant, label: e.target.value })}
                                placeholder="Etiqueta"
                                className="h-8"
                              />
                              <Input
                                value={editingVariant.value}
                                onChange={(e) => setEditingVariant({ ...editingVariant, value: e.target.value })}
                                placeholder="Valor"
                                className="h-8"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSaveVariantEdit}
                                disabled={addVariantMutation.isPending || removeVariantMutation.isPending}
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={cancelEditingVariant}
                                className="h-8 w-8 p-0"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={variant.active !== false ? "default" : "secondary"}
                                className="cursor-pointer"
                                onClick={() => handleUpdateVariant(
                                  group._id,
                                  variant.value,
                                  variant.value,
                                  !(variant.active !== false)
                                )}
                              >
                                {variant.label} ({variant.value})
                              </Badge>
                              <div className="flex items-center gap-1 opacity-0 group-hover/variant:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEditingVariant(group._id, variant)}
                                  className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                  title="Editar variante"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveVariant(group._id, variant.value)}
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  title="Eliminar variante"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
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