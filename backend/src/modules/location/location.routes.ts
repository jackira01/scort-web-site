import { Router } from 'express';
import { locationController } from './location.controller';
// import { authMiddleware, adminMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

/**
 * @route GET /api/locations
 * @desc Obtener todas las ubicaciones activas
 * @access Public
 */
router.get('/', locationController.getAll.bind(locationController));

/**
 * @route GET /api/locations/country
 * @desc Obtener el país (Colombia)
 * @access Public
 */
router.get('/country', locationController.getCountry.bind(locationController));

/**
 * @route GET /api/locations/departments
 * @desc Obtener todos los departamentos
 * @access Public
 * @returns Array<{ value: string, label: string }>
 */
router.get('/departments', locationController.getDepartments.bind(locationController));

/**
 * @route GET /api/locations/type/:type
 * @desc Obtener ubicaciones por tipo
 * @access Public
 */
router.get('/type/:type', locationController.getByType.bind(locationController));

/**
 * @route GET /api/locations/hierarchy
 * @desc Obtener jerarquía completa de ubicaciones
 * @access Public (podría ser Admin only)
 * @returns Estructura jerárquica completa
 */
router.get('/hierarchy', locationController.getHierarchy.bind(locationController));

/**
 * @route GET /api/locations/search
 * @desc Buscar ubicaciones por texto (autocomplete)
 * @access Public
 * @query q - Texto de búsqueda
 * @query limit - Límite de resultados (default: 10)
 */
router.get('/search', locationController.search.bind(locationController));

/**
 * @route GET /api/locations/validate/department/:value
 * @desc Validar si un departamento existe
 * @access Public
 */
router.get('/validate/department/:value', locationController.validateDepartment.bind(locationController));

/**
 * @route GET /api/locations/validate/city/:departmentValue/:cityValue
 * @desc Validar si una ciudad existe en un departamento
 * @access Public
 */
router.get('/validate/city/:departmentValue/:cityValue', locationController.validateCity.bind(locationController));

/**
 * @route GET /api/locations/:parentValue/children
 * @desc Obtener hijos de una ubicación (ciudades de un departamento, localidades de una ciudad, etc.)
 * @access Public
 * @param parentValue - Valor normalizado del padre (ej: "antioquia", "medellin")
 * @returns Array<{ value: string, label: string }>
 */
router.get('/:parentValue/children', locationController.getChildren.bind(locationController));

/**
 * @route POST /api/locations/bulk-import
 * @desc ⭐ IMPORTACIÓN MASIVA - Cargar toda la estructura de ubicaciones
 * @access Admin only (descomentar authMiddleware y adminMiddleware)
 * @body Ver location-import-example.json
 * 
 * ⚠️ IMPORTANTE: Este endpoint ELIMINA todas las ubicaciones existentes
 * y las reemplaza con los datos enviados. Usar con precaución.
 */
router.post(
    '/bulk-import',
    // authMiddleware,      // Descomentar para requerir autenticación
    // adminMiddleware,     // Descomentar para requerir rol admin
    locationController.bulkImport.bind(locationController)
);

/**
 * @route POST /api/locations
 * @desc Crear una ubicación individual
 * @access Admin only
 */
router.post(
    '/',
    // authMiddleware,
    // adminMiddleware,
    locationController.create.bind(locationController)
);

/**
 * @route PUT /api/locations/:id
 * @desc Actualizar una ubicación
 * @access Admin only
 */
router.put(
    '/:id',
    // authMiddleware,
    // adminMiddleware,
    locationController.update.bind(locationController)
);

/**
 * @route DELETE /api/locations/:id
 * @desc Eliminar una ubicación (soft delete)
 * @access Admin only
 */
router.delete(
    '/:id',
    // authMiddleware,
    // adminMiddleware,
    locationController.delete.bind(locationController)
);

/**
 * @route GET /api/locations/:id
 * @desc Obtener una ubicación por ID (debe ir al final para no conflictuar con otras rutas)
 * @access Public
 */
router.get('/:id', locationController.getById.bind(locationController));

export default router;
