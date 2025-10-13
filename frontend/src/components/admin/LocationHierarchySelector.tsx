import { MapPin, Building2, Globe } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import {
    useLocationAutocomplete,
    useLocationSelection,
    useLocationStats,
    useLocationValidation,
} from '../../hooks/useLocationHierarchy';
import type {
    CityData,
    DepartmentData,
} from '../../services/location-hierarchy.service';

interface LocationHierarchySelectorProps {
    selectedDepartment?: string;
    selectedCity?: string;
    onDepartmentChange: (department: string | undefined) => void;
    onCityChange: (city: string | undefined) => void;
    showStats?: boolean;
    allowCityOnly?: boolean;
    disabled?: boolean;
    error?: string;
    helperText?: string;
}

interface AutocompleteSuggestion {
    type: 'department' | 'city';
    value: string;
    label: string;
    subtitle?: string;
}

export const LocationHierarchySelector: React.FC<LocationHierarchySelectorProps> = ({
    selectedDepartment,
    selectedCity,
    onDepartmentChange,
    onCityChange,
    showStats = false,
    allowCityOnly = false,
    disabled = false,
    error,
    helperText,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showAutocomplete, setShowAutocomplete] = useState(false);

    const {
        departments,
        departmentsLoading,
        getDepartmentOptions,
        getCityOptions,
        validateSelection,
    } = useLocationSelection();

    const {
        allSuggestions,
        isLoading: searchLoading,
        hasResults,
    } = useLocationAutocomplete(searchTerm);

    const { validateDepartment, validateCity, getDepartmentByCity, getCityData } =
        useLocationValidation();

    const { data: stats } = useLocationStats();

    // Validar selección actual
    useEffect(() => {
        if (selectedDepartment && selectedCity) {
            const isValid = validateSelection(selectedDepartment, selectedCity);
            if (!isValid) {
                onCityChange(undefined);
            }
        }
    }, [selectedDepartment, selectedCity, validateSelection, onCityChange]);

    const handleDepartmentChange = (departmentValue: string | undefined) => {
        // Si el valor es "none", tratarlo como undefined
        const actualValue = departmentValue === "none" ? undefined : departmentValue;
        onDepartmentChange(actualValue);
        onCityChange(undefined); // Reset city when department changes
    };

    const handleAutocompleteSelect = (suggestion: AutocompleteSuggestion) => {
        if (suggestion.type === 'department') {
            handleDepartmentChange(suggestion.value);
        } else if (suggestion.type === 'city') {
            const department = getDepartmentByCity(suggestion.value);
            if (department) {
                onDepartmentChange(department.value);
                onCityChange(suggestion.value);
            }
        }
        setSearchTerm('');
        setShowAutocomplete(false);
    };

    const selectedDepartmentData = departments?.find(
        (d: DepartmentData) => d.value === selectedDepartment,
    );
    const selectedCityData = selectedDepartmentData?.cities.find(
        (c: CityData) => c.value === selectedCity,
    );

    if (departmentsLoading) {
        return (
            <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm text-muted-foreground">
                    Cargando ubicaciones...
                </span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Estadísticas */}
            {showStats && stats && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5" />
                            Estadísticas de Ubicaciones
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Departamentos
                                </p>
                                <p className="text-2xl font-semibold">{stats.totalDepartments}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Ciudades
                                </p>
                                <p className="text-2xl font-semibold">{stats.totalCities}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Mayor cobertura
                                </p>
                                <p className="text-sm font-medium">
                                    {stats.departmentWithMostCities?.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    ({stats.departmentWithMostCities?.count} ciudades)
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Búsqueda rápida */}
            <div className="space-y-2">
                <Label htmlFor="search-location">Búsqueda rápida</Label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="search-location"
                        placeholder="Buscar departamento o ciudad..."
                        value={searchTerm}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        className="pl-10"
                        disabled={disabled}
                    />
                    {searchLoading && (
                        <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />
                    )}
                </div>
                
                {/* Sugerencias de búsqueda */}
                {searchTerm.length >= 2 && allSuggestions && allSuggestions.length > 0 && (
                    <Card className="absolute z-10 w-full mt-1">
                        <CardContent className="p-2">
                            {allSuggestions.map((suggestion: AutocompleteSuggestion, index: number) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-2 p-2 hover:bg-muted cursor-pointer rounded"
                                    onClick={() => handleAutocompleteSelect(suggestion)}
                                >
                                    {suggestion.type === 'department' ? (
                                        <Building2 className="h-4 w-4 text-primary" />
                                    ) : (
                                        <MapPin className="h-4 w-4 text-secondary" />
                                    )}
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{suggestion.label}</p>
                                        {suggestion.subtitle && (
                                            <p className="text-xs text-muted-foreground">{suggestion.subtitle}</p>
                                        )}
                                    </div>
                                    <Badge variant="outline">
                                        {suggestion.type === 'department' ? 'Depto' : 'Ciudad'}
                                    </Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </div>

            <Separator />
            <p className="text-center text-sm text-muted-foreground">O selecciona manualmente</p>

            {/* Selectores manuales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Selector de Departamento */}
                <div className="space-y-2">
                    <Label htmlFor="department-select" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Departamento
                    </Label>
                    <Select
                        value={selectedDepartment || ''}
                        onValueChange={(value: string) => handleDepartmentChange(value || undefined)}
                        disabled={disabled}
                    >
                        <SelectTrigger id="department-select">
                            <SelectValue placeholder="Seleccionar departamento" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Seleccionar departamento</SelectItem>
                            {getDepartmentOptions().map((dept: any) => (
                                <SelectItem key={dept.value} value={dept.value}>
                                    <div className="flex items-center justify-between w-full">
                                        <span>{dept.label}</span>
                                        <Badge variant="outline" className="ml-2">
                                            {dept.cityCount} ciudades
                                        </Badge>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Selector de Ciudad */}
                <div className="space-y-2">
                    <Label htmlFor="city-select" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Ciudad
                    </Label>
                    <Select
                        value={selectedCity || ''}
                        onValueChange={(value: string) => {
                            // Si el valor es "none", tratarlo como undefined
                            const actualValue = value === "none" ? undefined : value;
                            onCityChange(actualValue);
                        }}
                        disabled={disabled || (!selectedDepartment && !allowCityOnly)}
                    >
                        <SelectTrigger id="city-select">
                            <SelectValue placeholder="Seleccionar ciudad" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Seleccionar ciudad</SelectItem>
                            {selectedDepartment &&
                                getCityOptions(selectedDepartment).map((city: any) => (
                                    <SelectItem key={city.value} value={city.value}>
                                        {city.label}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Selección actual */}
            {(selectedDepartmentData || selectedCityData) && (
                <Card>
                    <CardContent className="pt-4">
                        <p className="text-sm font-medium mb-2">Selección actual:</p>
                        {selectedDepartmentData && (
                            <div className="flex items-center gap-2 text-sm">
                                <Building2 className="h-4 w-4" />
                                <span><strong>Departamento:</strong> {selectedDepartmentData.label}</span>
                                {selectedDepartmentData.coordinates && (
                                    <span className="text-muted-foreground">
                                        ({selectedDepartmentData.coordinates.lat.toFixed(4)},{' '}
                                        {selectedDepartmentData.coordinates.lng.toFixed(4)})
                                    </span>
                                )}
                            </div>
                        )}
                        {selectedCityData && (
                            <div className="flex items-center gap-2 text-sm mt-1">
                                <MapPin className="h-4 w-4" />
                                <span><strong>Ciudad:</strong> {selectedCityData.label}</span>
                                {selectedCityData.coordinates && (
                                    <span className="text-muted-foreground">
                                        ({selectedCityData.coordinates.lat.toFixed(4)},{' '}
                                        {selectedCityData.coordinates.lng.toFixed(4)})
                                    </span>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Mensajes de error y ayuda */}
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {helperText && !error && (
                <p className="text-sm text-muted-foreground">{helperText}</p>
            )}
        </div>
    );
};

export default LocationHierarchySelector;
