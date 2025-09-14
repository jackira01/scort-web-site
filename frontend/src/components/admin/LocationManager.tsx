import {
    Plus as AddIcon,
    MapPin as CityIcon,
    Globe as CountryIcon,
    Trash2 as DeleteIcon,
    Building as DepartmentIcon,
    Download as DownloadIcon,
    Edit as EditIcon,
    ChevronDown as ExpandMoreIcon,
    RefreshCw as RefreshIcon,
    Upload as UploadIcon,
    Loader2
} from 'lucide-react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import React, { useState, useEffect } from 'react';
import { useConfigParameters, useConfigParameterMutations } from '../../hooks/use-config-parameters';
import type { ConfigParameter } from '../../types/config-parameter.types';
import {
    useCountry,
    useDepartments,
    useLocationStats
} from '../../hooks/useLocationHierarchy';
import { LocationHierarchySelector } from './LocationHierarchySelector';

// TabPanel no longer needed with shadcn/ui Tabs

/**
 * Componente para gestionar la jerarquía de ubicaciones
 * Compatible con la estructura de departamentos y ciudades de colombiaData.ts
 */
export const LocationManager: React.FC = () => {
    const [tabValue, setTabValue] = useState("0");
    const [openDialog, setOpenDialog] = useState(false);
    const [editingLocation, setEditingLocation] =
        useState<ConfigParameter | null>(null);
    const [selectedDepartment, setSelectedDepartment] = useState<string | undefined>(
        undefined,
    );
    const [selectedCity, setSelectedCity] = useState<string | undefined>(undefined);

    // Hooks para datos
    const { data: country, isLoading: countryLoading } = useCountry();
    const {
        data: departments,
        isLoading: departmentsLoading,
        refetch: refetchDepartments,
    } = useDepartments();
    const { data: stats, isLoading: statsLoading } = useLocationStats();
    const {
        create: createConfigParameter,
        update: updateConfigParameter,
        delete: deleteConfigParameter,
    } = useConfigParameterMutations();

    // handleTabChange no longer needed with shadcn/ui Tabs

    const handleAddLocation = () => {
        setEditingLocation(null);
        setOpenDialog(true);
    };

    const handleEditLocation = (location: ConfigParameter) => {
        setEditingLocation(location);
        setOpenDialog(true);
    };

    const handleDeleteLocation = async (location: ConfigParameter) => {
        if (
            window.confirm(
                `¿Estás seguro de que deseas eliminar "${location.value.name}"?`,
            )
        ) {
            try {
                await deleteConfigParameter(location._id);
                refetchDepartments();
            } catch (error) {
          
            }
        }
    };

    const handleSaveLocation = async (locationData: any) => {
        try {
            if (editingLocation) {
                await updateConfigParameter(editingLocation._id, locationData);
            } else {
                await createConfigParameter(locationData);
            }
            setOpenDialog(false);
            refetchDepartments();
        } catch (error) {
      
        }
    };

    const handleRefresh = () => {
        refetchDepartments();
    };

    if (countryLoading || departmentsLoading || statsLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <CountryIcon className="w-8 h-8" />
                    Gestión de Ubicaciones
                </h1>
                <div className="flex items-center gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleRefresh}
                                    disabled={departmentsLoading}
                                >
                                    <RefreshIcon className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Actualizar datos</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <Button onClick={handleAddLocation}>
                        <AddIcon className="mr-2 h-4 w-4" />
                        Agregar Ubicación
                    </Button>
                </div>
            </div>

            {/* Estadísticas generales */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold text-primary flex items-center gap-2 mb-2">
                                <CountryIcon className="w-5 h-5" />
                                País
                            </h3>
                            <p className="text-3xl font-bold mb-1">
                                {country?.label || 'Colombia'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {country?.code || 'CO'} • {country?.currency || 'COP'}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold text-primary flex items-center gap-2 mb-2">
                                <DepartmentIcon className="w-5 h-5" />
                                Departamentos
                            </h3>
                            <p className="text-3xl font-bold mb-1">{stats.totalDepartments}</p>
                            <p className="text-sm text-muted-foreground">
                                Divisiones administrativas
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold text-primary flex items-center gap-2 mb-2">
                                <CityIcon className="w-5 h-5" />
                                Ciudades
                            </h3>
                            <p className="text-3xl font-bold mb-1">{stats.totalCities}</p>
                            <p className="text-sm text-muted-foreground">
                                {stats.departmentWithMostCities && (
                                    <>Mayor cobertura: {stats.departmentWithMostCities.name}</>
                                )}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Tabs */}
            <Card>
                <Tabs value={tabValue} onValueChange={setTabValue}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="0" className="flex items-center gap-2">
                            <DepartmentIcon className="w-4 h-4" />
                            Vista Jerárquica
                        </TabsTrigger>
                        <TabsTrigger value="1" className="flex items-center gap-2">
                            <CityIcon className="w-4 h-4" />
                            Selector de Ubicaciones
                        </TabsTrigger>
                        <TabsTrigger value="2" className="flex items-center gap-2">
                            <CountryIcon className="w-4 h-4" />
                            Configuración
                        </TabsTrigger>
                    </TabsList>

                    {/* Vista Jerárquica */}
                    <TabsContent value="0" className="p-6">
                        <h2 className="text-xl font-semibold mb-4">
                            Estructura Jerárquica de Ubicaciones
                        </h2>
                        <p className="text-sm text-muted-foreground mb-6">
                            Estructura compatible con colombiaData.ts: País → Departamentos →
                            Ciudades
                        </p>

                        <Accordion type="single" collapsible className="space-y-2">
                            {departments && departments.length > 0 ? departments.map((department) => (
                                <AccordionItem key={department.value} value={department.value}>
                                    <AccordionTrigger className="hover:no-underline">
                                        <div className="flex items-center justify-between w-full pr-4">
                                            <div className="flex items-center gap-2">
                                                <DepartmentIcon className="w-5 h-5 text-primary" />
                                                <div className="text-left">
                                                    <p className="font-medium">{department.label}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {department.cityCount} ciudades
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant="outline">
                                                {department.cityCount}
                                            </Badge>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                            {department.cities && department.cities.length > 0 ? department.cities.map((city) => (
                                                <div
                                                    key={city.value}
                                                    className="flex items-center gap-2 p-2 border border-border rounded-md"
                                                >
                                                    <CityIcon className="w-4 h-4 text-secondary" />
                                                    <span className="text-sm flex-1">{city.label}</span>
                                                    {city.coordinates && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Badge variant="outline" className="text-xs h-5">
                                                                        GPS
                                                                    </Badge>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{city.coordinates.lat.toFixed(4)}, {city.coordinates.lng.toFixed(4)}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                </div>
                                            )) : (
                                                <div className="text-center py-4 text-muted-foreground">
                                                    No hay ciudades disponibles
                                                </div>
                                            )}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            )) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    No hay departamentos disponibles
                                </div>
                            )}
                        </Accordion>
                    </TabsContent>

                    {/* Selector de Ubicaciones */}
                    <TabsContent value="1" className="p-6">
                        <h2 className="text-xl font-semibold mb-4">
                            Selector de Ubicaciones
                        </h2>
                        <p className="text-sm text-muted-foreground mb-6">
                            Prueba el selector jerárquico de ubicaciones que mantiene la
                            estructura de colombiaData.ts
                        </p>

                        <LocationHierarchySelector
                            selectedDepartment={selectedDepartment}
                            selectedCity={selectedCity}
                            onDepartmentChange={setSelectedDepartment}
                            onCityChange={setSelectedCity}
                            showStats={true}
                            helperText="Este selector mantiene la estructura jerárquica original de departamentos y ciudades"
                        />
                    </TabsContent>

                    {/* Configuración */}
                    <TabsContent value="2" className="p-6">
                        <h2 className="text-xl font-semibold mb-4">
                            Configuración del Sistema
                        </h2>

                        <Alert className="mb-6">
                            <AlertDescription>
                                <strong>Estructura Compatible:</strong> El sistema mantiene la
                                misma estructura jerárquica que tenías en{' '}
                                <code>colombiaData.ts</code>, con departamentos y sus respectivas
                                ciudades.
                            </AlertDescription>
                        </Alert>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <UploadIcon className="w-5 h-5" />
                                        Migración de Datos
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Migra los datos existentes de colombiaData.ts al nuevo
                                        sistema ConfigParameter.
                                    </p>
                                    <Button variant="outline" className="w-full">
                                        <UploadIcon className="mr-2 h-4 w-4" />
                                        Ejecutar Migración
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <DownloadIcon className="w-5 h-5" />
                                        Exportar Datos
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Exporta la estructura actual a formato JSON compatible.
                                    </p>
                                    <Button variant="outline" className="w-full">
                                        <DownloadIcon className="mr-2 h-4 w-4" />
                                        Exportar JSON
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Información técnica */}
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold mb-4">
                                Información Técnica
                            </h3>
                            <div className="space-y-3">
                                <div className="border-l-4 border-primary pl-4">
                                    <h4 className="font-medium">Estructura de Datos</h4>
                                    <p className="text-sm text-muted-foreground">
                                        País → Departamentos → Ciudades (compatible con colombiaData.ts)
                                    </p>
                                </div>
                                <div className="border-l-4 border-primary pl-4">
                                    <h4 className="font-medium">Almacenamiento</h4>
                                    <p className="text-sm text-muted-foreground">
                                        MongoDB con esquema flexible ConfigParameter
                                    </p>
                                </div>
                                <div className="border-l-4 border-primary pl-4">
                                    <h4 className="font-medium">API</h4>
                                    <p className="text-sm text-muted-foreground">
                                        RESTful API con endpoints para CRUD y búsqueda jerárquica
                                    </p>
                                </div>
                                <div className="border-l-4 border-primary pl-4">
                                    <h4 className="font-medium">Frontend</h4>
                                    <p className="text-sm text-muted-foreground">
                                        React Query para cache y estado, componentes reutilizables
                                    </p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </Card>

            {/* Dialog para agregar/editar ubicación */}
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editingLocation ? 'Editar Ubicación' : 'Agregar Nueva Ubicación'}
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground mb-4">
                        Funcionalidad de edición en desarrollo. Por ahora, usa el script de
                        migración para importar datos desde colombiaData.ts.
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancelar</Button>
                        <Button onClick={() => setOpenDialog(false)}>
                            Guardar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default LocationManager;
