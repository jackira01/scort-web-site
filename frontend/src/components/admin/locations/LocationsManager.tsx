'use client';

import { useState } from 'react';
import { MapPin, Plus, Trash2, Edit, Search, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { useLocations, useCreateLocation, useUpdateLocation, useDeleteLocation } from '@/hooks/use-locations';
import type { LocationType } from '@/types/location.types';

interface LocationFormData {
    value: string;
    label: string;
    type: LocationType;
    parentId?: string;
}

export default function LocationsManager() {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<any>(null);
    const [deletingLocation, setDeletingLocation] = useState<any>(null);
    const [formData, setFormData] = useState<LocationFormData>({
        value: '',
        label: '',
        type: 'department',
        parentId: undefined,
    });

    const { data: locations, isLoading } = useLocations();
    const createMutation = useCreateLocation();
    const updateMutation = useUpdateLocation();
    const deleteMutation = useDeleteLocation();

    // Obtener el país (Colombia)
    const country = locations?.find(loc => loc.type === 'country');

    // Obtener departamentos
    const departments = locations?.filter(loc => loc.type === 'department') || [];

    // Función para obtener ciudades de un departamento
    const getCitiesByDepartment = (departmentId: string) => {
        return locations?.filter(loc => loc.type === 'city' && loc.parentId === departmentId) || [];
    };

    // Toggle expansión de departamento
    const toggleDepartment = (departmentId: string) => {
        setExpandedDepartments(prev => {
            const newSet = new Set(prev);
            if (newSet.has(departmentId)) {
                newSet.delete(departmentId);
            } else {
                newSet.add(departmentId);
            }
            return newSet;
        });
    };

    // Filtrar ubicaciones por búsqueda
    const filteredDepartments = departments.filter(dept =>
        dept.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCitiesByDepartment(dept._id).some(city =>
            city.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    // Abrir diálogo para crear
    const handleCreate = (type: LocationType, parentId?: string) => {
        setEditingLocation(null);
        setFormData({
            value: '',
            label: '',
            type,
            parentId,
        });
        setDialogOpen(true);
    };

    // Abrir diálogo para editar
    const handleEdit = (location: any) => {
        setEditingLocation(location);
        setFormData({
            value: location.value,
            label: location.label,
            type: location.type,
            parentId: location.parentId,
        });
        setDialogOpen(true);
    };

    // Abrir diálogo de eliminación
    const handleDeleteClick = (location: any) => {
        setDeletingLocation(location);
        setDeleteDialogOpen(true);
    };

    // Guardar (crear o actualizar)
    const handleSave = async () => {
        if (!formData.label.trim()) {
            toast.error('El nombre es requerido');
            return;
        }

        try {
            if (editingLocation) {
                await updateMutation.mutateAsync({
                    id: editingLocation._id,
                    data: formData,
                });
                toast.success('Ubicación actualizada correctamente');
            } else {
                await createMutation.mutateAsync(formData);
                toast.success('Ubicación creada correctamente');
            }
            setDialogOpen(false);
            resetForm();
        } catch (error: any) {
            toast.error(error.message || 'Error al guardar la ubicación');
        }
    };

    // Eliminar ubicación
    const handleDelete = async () => {
        if (!deletingLocation) return;

        try {
            await deleteMutation.mutateAsync(deletingLocation._id);
            toast.success('Ubicación eliminada correctamente');
            setDeleteDialogOpen(false);
            setDeletingLocation(null);
        } catch (error: any) {
            toast.error(error.message || 'Error al eliminar la ubicación');
        }
    };

    // Resetear formulario
    const resetForm = () => {
        setFormData({
            value: '',
            label: '',
            type: 'department',
            parentId: undefined,
        });
        setEditingLocation(null);
    };

    // Generar valor automáticamente desde label
    const handleLabelChange = (label: string) => {
        setFormData(prev => ({
            ...prev,
            label,
            value: label
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, ''),
        }));
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestión de Localidades</h1>
                    <p className="text-muted-foreground">
                        Administra departamentos y ciudades de Colombia
                    </p>
                </div>
                <Button onClick={() => handleCreate('department', country?._id)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Departamento
                </Button>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">País</p>
                                <p className="text-2xl font-bold">{country?.label || 'N/A'}</p>
                            </div>
                            <MapPin className="w-8 h-8 text-primary" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Departamentos</p>
                                <p className="text-2xl font-bold">{departments.length}</p>
                            </div>
                            <MapPin className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Ciudades</p>
                                <p className="text-2xl font-bold">
                                    {locations?.filter(loc => loc.type === 'city').length || 0}
                                </p>
                            </div>
                            <MapPin className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Búsqueda */}
            <Card>
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            placeholder="Buscar departamentos o ciudades..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Lista de Ubicaciones */}
            <Card>
                <CardHeader>
                    <CardTitle>Ubicaciones</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {filteredDepartments.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                No se encontraron ubicaciones
                            </p>
                        ) : (
                            filteredDepartments.map(department => {
                                const cities = getCitiesByDepartment(department._id);
                                const isExpanded = expandedDepartments.has(department._id);

                                return (
                                    <div key={department._id} className="border rounded-lg">
                                        {/* Departamento */}
                                        <div className="flex items-center justify-between p-4 hover:bg-accent">
                                            <div className="flex items-center gap-3 flex-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggleDepartment(department._id)}
                                                    className="p-0 h-6 w-6"
                                                >
                                                    {isExpanded ? (
                                                        <ChevronDown className="w-4 h-4" />
                                                    ) : (
                                                        <ChevronRight className="w-4 h-4" />
                                                    )}
                                                </Button>
                                                <MapPin className="w-5 h-5 text-blue-500" />
                                                <div>
                                                    <p className="font-medium">{department.label}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {cities.length} {cities.length === 1 ? 'ciudad' : 'ciudades'}
                                                    </p>
                                                </div>
                                                <Badge variant="outline" className="ml-2">
                                                    {department.type}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleCreate('city', department._id)}
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(department)}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(department)}
                                                >
                                                    <Trash2 className="w-4 h-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Ciudades (expandidas) */}
                                        {isExpanded && cities.length > 0 && (
                                            <div className="border-t bg-muted/30">
                                                {cities.map(city => (
                                                    <div
                                                        key={city._id}
                                                        className="flex items-center justify-between p-4 pl-16 hover:bg-accent"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <MapPin className="w-4 h-4 text-green-500" />
                                                            <span className="text-sm">{city.label}</span>
                                                            <Badge variant="secondary" className="text-xs">
                                                                {city.type}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleEdit(city)}
                                                            >
                                                                <Edit className="w-3 h-3" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDeleteClick(city)}
                                                            >
                                                                <Trash2 className="w-3 h-3 text-destructive" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Dialog Crear/Editar */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingLocation ? 'Editar Ubicación' : 'Nueva Ubicación'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingLocation
                                ? 'Modifica los datos de la ubicación'
                                : 'Completa los datos de la nueva ubicación'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="label">Nombre *</Label>
                            <Input
                                id="label"
                                value={formData.label}
                                onChange={(e) => handleLabelChange(e.target.value)}
                                placeholder="Ej: Bogotá, Medellín"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="value">Valor (slug)</Label>
                            <Input
                                id="value"
                                value={formData.value}
                                disabled
                                placeholder="Se genera automáticamente"
                                className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">
                                Se genera automáticamente desde el nombre
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="type">Tipo</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value) =>
                                    setFormData(prev => ({ ...prev, type: value as LocationType }))
                                }
                                disabled
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="country">País</SelectItem>
                                    <SelectItem value="department">Departamento</SelectItem>
                                    <SelectItem value="city">Ciudad</SelectItem>
                                    <SelectItem value="locality">Localidad</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                El tipo se establece automáticamente según la ubicación padre
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDialogOpen(false);
                                resetForm();
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={createMutation.isPending || updateMutation.isPending}
                        >
                            {(createMutation.isPending || updateMutation.isPending) && (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            )}
                            {editingLocation ? 'Guardar Cambios' : 'Crear Ubicación'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog Eliminar */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará permanentemente la ubicación{' '}
                            <strong>{deletingLocation?.label}</strong>
                            {deletingLocation?.type === 'department' && (
                                <span className="block mt-2 text-destructive font-medium">
                                    ⚠️ Esto también eliminará todas las ciudades asociadas
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletingLocation(null)}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending && (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            )}
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
