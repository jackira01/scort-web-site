import {
    Add as AddIcon,
    LocationCity as CityIcon,
    Public as CountryIcon,
    Delete as DeleteIcon,
    Domain as DepartmentIcon,
    Download as DownloadIcon,
    Edit as EditIcon,
    ExpandMore as ExpandMoreIcond
    Refreshdas RefreshIcon,
    UploadaasnUploadIcon
    ,
    Loca@mui / icons - materiality as CityIcon,
    Public as CountryIcon,
    Delete as DeleteIcon,
    Domain as DepartmentIcon,
    Download as DownloadIcon,
    Edit as EditIcon,
    ExpandMore as ExpandMoreIcon,
    Refresh as RefreshIcon,
    Upload as UploadIcon,
} from '@mui/icons-material';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItReactet{
        useStateuuseDeparreactonStats,
    }  useConfigParameters figParameter } from useConfigParametersparameter.t
useCountry,
    useDepartments,
    useLocationStats
rarchySel.e../ hooks / useLocationHierarchyerarchySeltype ecConfigParameterbPanelProps {
    typesdconfig - parameter.typesde;
    indembLocationHierarchySelectormber;
}

fnLocationHierarchySelectorrops) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`location-tabpanel-${index}`}
            aria-labelledby={`location-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

/**
 * Componente para gestionar la jerarquía de ubicaciones
 * Compatible con la estructura de departamentos y ciudades de colombiaData.ts
 */
export const LocationManager: React.FC = () => {
    const [tabValue, setTabValue] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingLocation, setEditingLocation] =
        useState<ConfigParameter | null>(null);
    const [selectedDepartment, setSelectedDepartment] = useState<string | null>(
        null,
    );
    const [selectedCity, setSelectedCity] = useState<string | null>(null);

    // Hooks para datos
    const { data: country, isLoading: countryLoading } = useCountry();
    const {
        data: departments,
        isLoading: departmentsLoading,
        refetch: refetchDepartments,
    } = useDepartments();
    const { data: stats, isLoading: statsLoading } = useLocationStats();
    const {
        createConfigParameter,
        updateConfigParameter,
        deleteConfigParameter,
    } = useConfigParameters();

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

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
                await deleteConfigParameter.mutateAsync(location._id);
                refetchDepartments();
            } catch (error) {
          
            }
        }
    };

    const handleSaveLocation = async (locationData: any) => {
        try {
            if (editingLocation) {
                await updateConfigParameter.mutateAsync({
                    id: editingLocation._id,
                    data: locationData,
                });
            } else {
                await createConfigParameter.mutateAsync(locationData);
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
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight={400}
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
            >
                <Typography variant="h4" component="h1">
                    <CountryIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
                    Gestión de Ubicaciones
                </Typography>
                <Box>
                    <Tooltip title="Actualizar datos">
                        <IconButton onClick={handleRefresh} disabled={departmentsLoading}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddLocation}
                        sx={{ ml: 1 }}
                    >
                        Agregar Ubicación
                    </Button>
                </Box>
            </Box>

            {/* Estadísticas generales */}
            {stats && (
                <Grid container spacing={3} mb={3}>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" color="primary">
                                    <CountryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    País
                                </Typography>
                                <Typography variant="h4">
                                    {country?.label || 'Colombia'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {country?.code || 'CO'} • {country?.currency || 'COP'}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" color="primary">
                                    <DepartmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    Departamentos
                                </Typography>
                                <Typography variant="h4">{stats.totalDepartments}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Divisiones administrativas
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" color="primary">
                                    <CityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    Ciudades
                                </Typography>
                                <Typography variant="h4">{stats.totalCities}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {stats.departmentWithMostCities && (
                                        <>Mayor cobertura: {stats.departmentWithMostCities.name}</>
                                    )}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Tabs */}
            <Card>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={handleTabChange}>
                        <Tab
                            label="Vista Jerárquica"
                            icon={<DepartmentIcon />}
                            iconPosition="start"
                        />
                        <Tab
                            label="Selector de Ubicaciones"
                            icon={<CityIcon />}
                            iconPosition="start"
                        />
                        <Tab
                            label="Configuración"
                            icon={<CountryIcon />}
                            iconPosition="start"
                        />
                    </Tabs>
                </Box>

                {/* Vista Jerárquica */}
                <TabPanel value={tabValue} index={0}>
                    <Typography variant="h6" gutterBottom>
                        Estructura Jerárquica de Ubicaciones
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        Estructura compatible con colombiaData.ts: País → Departamentos →
                        Ciudades
                    </Typography>

                    {departments?.map((department) => (
                        <Accordion key={department.value} sx={{ mb: 1 }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Box display="flex" alignItems="center" width="100%">
                                    <DepartmentIcon sx={{ mr: 2, color: 'primary.main' }} />
                                    <Box flexGrow={1}>
                                        <Typography variant="subtitle1">
                                            {department.label}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {department.cityCount} ciudades
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={department.cityCount}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                    />
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid container spacing={1}>
                                    {department.cities.map((city) => (
                                        <Grid item xs={12} sm={6} md={4} key={city.value}>
                                            <Box
                                                display="flex"
                                                alignItems="center"
                                                p={1}
                                                border={1}
                                                borderColor="divider"
                                                borderRadius={1}
                                            >
                                                <CityIcon
                                                    sx={{ mr: 1, color: 'secondary.main', fontSize: 16 }}
                                                />
                                                <Typography variant="body2" flexGrow={1}>
                                                    {city.label}
                                                </Typography>
                                                {city.coordinates && (
                                                    <Tooltip
                                                        title={`${city.coordinates.lat.toFixed(4)}, ${city.coordinates.lng.toFixed(4)}`}
                                                    >
                                                        <Chip
                                                            label="GPS"
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{ fontSize: '0.7rem', height: 20 }}
                                                        />
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </TabPanel>

                {/* Selector de Ubicaciones */}
                <TabPanel value={tabValue} index={1}>
                    <Typography variant="h6" gutterBottom>
                        Selector de Ubicaciones
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        Prueba el selector jerárquico de ubicaciones que mantiene la
                        estructura de colombiaData.ts
                    </Typography>

                    <LocationHierarchySelector
                        selectedDepartment={selectedDepartment}
                        selectedCity={selectedCity}
                        onDepartmentChange={setSelectedDepartment}
                        onCityChange={setSelectedCity}
                        showStats={true}
                        helperText="Este selector mantiene la estructura jerárquica original de departamentos y ciudades"
                    />
                </TabPanel>

                {/* Configuración */}
                <TabPanel value={tabValue} index={2}>
                    <Typography variant="h6" gutterBottom>
                        Configuración del Sistema
                    </Typography>

                    <Alert severity="info" sx={{ mb: 3 }}>
                        <Typography variant="body2">
                            <strong>Estructura Compatible:</strong> El sistema mantiene la
                            misma estructura jerárquica que tenías en{' '}
                            <code>colombiaData.ts</code>, con departamentos y sus respectivas
                            ciudades.
                        </Typography>
                    </Alert>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Card variant="outlined">
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        <UploadIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                        Migración de Datos
                                    </Typography>
                                    <Typography variant="body2" paragraph>
                                        Migra los datos existentes de colombiaData.ts al nuevo
                                        sistema ConfigParameter.
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        startIcon={<UploadIcon />}
                                        fullWidth
                                    >
                                        Ejecutar Migración
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Card variant="outlined">
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        <DownloadIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                        Exportar Datos
                                    </Typography>
                                    <Typography variant="body2" paragraph>
                                        Exporta la estructura actual a formato JSON compatible.
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        startIcon={<DownloadIcon />}
                                        fullWidth
                                    >
                                        Exportar JSON
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Información técnica */}
                    <Box mt={3}>
                        <Typography variant="h6" gutterBottom>
                            Información Técnica
                        </Typography>
                        <List>
                            <ListItem>
                                <ListItemText
                                    primary="Estructura de Datos"
                                    secondary="País → Departamentos → Ciudades (compatible con colombiaData.ts)"
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemText
                                    primary="Almacenamiento"
                                    secondary="MongoDB con esquema flexible ConfigParameter"
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemText
                                    primary="API"
                                    secondary="RESTful API con endpoints para CRUD y búsqueda jerárquica"
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemText
                                    primary="Frontend"
                                    secondary="React Query para cache y estado, componentes reutilizables"
                                />
                            </ListItem>
                        </List>
                    </Box>
                </TabPanel>
            </Card>

            {/* Dialog para agregar/editar ubicación */}
            <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {editingLocation ? 'Editar Ubicación' : 'Agregar Nueva Ubicación'}
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        Funcionalidad de edición en desarrollo. Por ahora, usa el script de
                        migración para importar datos desde colombiaData.ts.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={() => setOpenDialog(false)}>
                        Guardar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default LocationManager;
