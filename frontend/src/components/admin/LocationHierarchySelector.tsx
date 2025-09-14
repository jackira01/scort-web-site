import {
    LocationCity as CityIcon,
    Public as CountryIcon,
    Domain as DepartmentIcon,
    LocationOn as LocationIcon,
} from '@mui/icons-material';
import {
    Alert,
    Autocomplete,
    Box,
    Chip,
    CircularProgress,
    Divider,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    TextField,
    Typography,
} from '@mui/material';
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

/**
 * Componente selector jerárquico de ubicaciones
 * Compatible con la estructura de departamentos y ciudades de colombiaData.ts
 */
export const LocationHierarchySelector: React.FC<
    LocationHierarchySelectorProps
> = ({
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
            onDepartmentChange(departmentValue);
            onCityChange(undefined); // Reset city when department changes
        };

        const handleAutocompleteSelect = (suggestion: any) => {
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
            (d) => d.value === selectedDepartment,
        );
        const selectedCityData = selectedDepartmentData?.cities.find(
            (c) => c.value === selectedCity,
        );

        if (departmentsLoading) {
            return (
                <Box display="flex" alignItems="center" gap={2}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">
                        Cargando ubicaciones...
                    </Typography>
                </Box>
            );
        }

        return (
            <Box>
                {/* Estadísticas */}
                {showStats && stats && (
                    <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                        <Typography variant="h6" gutterBottom>
                            <CountryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Estadísticas de Ubicaciones
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={4}>
                                <Typography variant="body2" color="text.secondary">
                                    Departamentos
                                </Typography>
                                <Typography variant="h6">{stats.totalDepartments}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography variant="body2" color="text.secondary">
                                    Ciudades
                                </Typography>
                                <Typography variant="h6">{stats.totalCities}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography variant="body2" color="text.secondary">
                                    Mayor cobertura
                                </Typography>
                                <Typography variant="body2">
                                    {stats.departmentWithMostCities?.name}
                                    <br />
                                    <small>
                                        ({stats.departmentWithMostCities?.count} ciudades)
                                    </small>
                                </Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                )}

                {/* Búsqueda rápida */}
                <Box mb={2}>
                    <Autocomplete
                        options={allSuggestions}
                        getOptionLabel={(option) => option.label}
                        renderOption={(props, option) => (
                            <Box component="li" {...props}>
                                <Box display="flex" alignItems="center" width="100%">
                                    {option.type === 'department' ? (
                                        <DepartmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                                    ) : (
                                        <CityIcon sx={{ mr: 1, color: 'secondary.main' }} />
                                    )}
                                    <Box flexGrow={1}>
                                        <Typography variant="body2">{option.label}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {option.subtitle}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={option.type === 'department' ? 'Depto' : 'Ciudad'}
                                        size="small"
                                        color={option.type === 'department' ? 'primary' : 'secondary'}
                                        variant="outlined"
                                    />
                                </Box>
                            </Box>
                        )}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Buscar departamento o ciudad"
                                placeholder="Escribe para buscar..."
                                InputProps={{
                                    ...params.InputProps,
                                    startAdornment: (
                                        <LocationIcon sx={{ mr: 1, color: 'action.active' }} />
                                    ),
                                    endAdornment: (
                                        <>
                                            {searchLoading && <CircularProgress size={20} />}
                                            {params.InputProps.endAdornment}
                                        </>
                                    ),
                                }}
                                disabled={disabled}
                            />
                        )}
                        inputValue={searchTerm}
                        onInputChange={(_, value) => setSearchTerm(value)}
                        onChange={(_, value) => value && handleAutocompleteSelect(value)}
                        loading={searchLoading}
                        loadingText="Buscando..."
                        noOptionsText={
                            searchTerm.length < 2
                                ? 'Escribe al menos 2 caracteres'
                                : 'No se encontraron resultados'
                        }
                        disabled={disabled}
                    />
                </Box>

                <Divider sx={{ my: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                        O selecciona manualmente
                    </Typography>
                </Divider>

                {/* Selección manual */}
                <Grid container spacing={2}>
                    {/* Selector de Departamento */}
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth error={!!error}>
                            <InputLabel id="department-select-label">
                                <DepartmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Departamento
                            </InputLabel>
                            <Select
                                labelId="department-select-label"
                                value={selectedDepartment || ''}
                                onChange={(e) => handleDepartmentChange(e.target.value || undefined)}
                                label="Departamento"
                                disabled={disabled}
                            >
                                <MenuItem value="">
                                    <em>Seleccionar departamento</em>
                                </MenuItem>
                                {getDepartmentOptions().map((dept) => (
                                    <MenuItem key={dept.value} value={dept.value}>
                                        <Box
                                            display="flex"
                                            justifyContent="space-between"
                                            width="100%"
                                        >
                                            <span>{dept.label}</span>
                                            <Chip
                                                label={`${dept.cityCount} ciudades`}
                                                size="small"
                                                variant="outlined"
                                                sx={{ ml: 1 }}
                                            />
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Selector de Ciudad */}
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth error={!!error}>
                            <InputLabel id="city-select-label">
                                <CityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Ciudad
                            </InputLabel>
                            <Select
                                labelId="city-select-label"
                                value={selectedCity || ''}
                                onChange={(e) => onCityChange(e.target.value || undefined)}
                                label="Ciudad"
                                disabled={disabled || (!selectedDepartment && !allowCityOnly)}
                            >
                                <MenuItem value="">
                                    <em>Seleccionar ciudad</em>
                                </MenuItem>
                                {selectedDepartment &&
                                    getCityOptions(selectedDepartment).map((city) => (
                                        <MenuItem key={city.value} value={city.value}>
                                            {city.label}
                                        </MenuItem>
                                    ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                {/* Información de selección actual */}
                {(selectedDepartmentData || selectedCityData) && (
                    <Box mt={2}>
                        <Paper sx={{ p: 2, bgcolor: 'action.hover' }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Selección actual:
                            </Typography>
                            {selectedDepartmentData && (
                                <Typography variant="body2">
                                    <DepartmentIcon
                                        sx={{ mr: 1, verticalAlign: 'middle', fontSize: 16 }}
                                    />
                                    <strong>Departamento:</strong> {selectedDepartmentData.label}
                                    {selectedDepartmentData.coordinates && (
                                        <span style={{ marginLeft: 8, color: 'text.secondary' }}>
                                            ({selectedDepartmentData.coordinates.lat.toFixed(4)},{' '}
                                            {selectedDepartmentData.coordinates.lng.toFixed(4)})
                                        </span>
                                    )}
                                </Typography>
                            )}
                            {selectedCityData && (
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                    <CityIcon
                                        sx={{ mr: 1, verticalAlign: 'middle', fontSize: 16 }}
                                    />
                                    <strong>Ciudad:</strong> {selectedCityData.label}
                                    {selectedCityData.coordinates && (
                                        <span style={{ marginLeft: 8, color: 'text.secondary' }}>
                                            ({selectedCityData.coordinates.lat.toFixed(4)},{' '}
                                            {selectedCityData.coordinates.lng.toFixed(4)})
                                        </span>
                                    )}
                                </Typography>
                            )}
                        </Paper>
                    </Box>
                )}

                {/* Error y texto de ayuda */}
                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}
                {helperText && !error && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 1, display: 'block' }}
                    >
                        {helperText}
                    </Typography>
                )}
            </Box>
        );
    };

export default LocationHierarchySelector;
