import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { plansController } from './plans.controller';

const router = Router();

// ==================== VALIDACIONES COMUNES ====================

const planCodeValidation = body('code')
    .isString()
    .isLength({ min: 2, max: 20 })
    .matches(/^[A-Z_]+$/)
    .withMessage('El código debe contener solo letras mayúsculas y guiones bajos');

const planNameValidation = body('name')
    .isString()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres');

const planLevelValidation = body('level')
    .isInt({ min: 1, max: 5 })
    .withMessage('El nivel debe ser un número entero entre 1 y 5');

const planVariantsValidation = body('variants')
    .isArray({ min: 1 })
    .withMessage('Debe incluir al menos una variante')
    .custom((variants) => {
        for (const variant of variants) {
            if (!variant.days || !Number.isInteger(variant.days) || variant.days <= 0) {
                throw new Error('Cada variante debe tener días válidos (número entero positivo)');
            }
            if (typeof variant.price !== 'number' || variant.price < 0) {
                throw new Error('Cada variante debe tener un precio válido (número no negativo)');
            }
            if (!Number.isInteger(variant.durationRank) || variant.durationRank < 0) {
                throw new Error('Cada variante debe tener un durationRank válido (número entero >= 0)');
            }
        }
        return true;
    });

const planFeaturesValidation = body('features')
    .isObject()
    .custom((features) => {
        const requiredFields = ['showInHome', 'showInFilters', 'showInSponsored'];
        for (const field of requiredFields) {
            if (typeof features[field] !== 'boolean') {
                throw new Error(`El campo features.${field} debe ser un booleano`);
            }
        }
        return true;
    });

const planContentLimitsValidation = body('contentLimits')
    .isObject()
    .custom((limits) => {
        // Validar photos
        if (!limits.photos || typeof limits.photos !== 'object') {
            throw new Error('contentLimits.photos es requerido y debe ser un objeto');
        }
        if (!Number.isInteger(limits.photos.min) || limits.photos.min < 0) {
            throw new Error('contentLimits.photos.min debe ser un número entero >= 0');
        }
        if (!Number.isInteger(limits.photos.max) || limits.photos.max < limits.photos.min) {
            throw new Error('contentLimits.photos.max debe ser un número entero >= min');
        }
        
        // Validar videos
        if (!limits.videos || typeof limits.videos !== 'object') {
            throw new Error('contentLimits.videos es requerido y debe ser un objeto');
        }
        if (!Number.isInteger(limits.videos.min) || limits.videos.min < 0) {
            throw new Error('contentLimits.videos.min debe ser un número entero >= 0');
        }
        if (!Number.isInteger(limits.videos.max) || limits.videos.max < limits.videos.min) {
            throw new Error('contentLimits.videos.max debe ser un número entero >= min');
        }
        
        // Validar storiesPerDayMax
        if (!Number.isInteger(limits.storiesPerDayMax) || limits.storiesPerDayMax < 0) {
            throw new Error('contentLimits.storiesPerDayMax debe ser un número entero >= 0');
        }
        
        return true;
    });

const planIncludedUpgradesValidation = body('includedUpgrades')
    .optional()
    .isArray()
    .withMessage('includedUpgrades debe ser un array')
    .custom((upgrades) => {
        if (upgrades) {
            for (const upgrade of upgrades) {
                if (typeof upgrade !== 'string' || upgrade.length < 2) {
                    throw new Error('Cada upgrade incluido debe ser un string válido');
                }
            }
        }
        return true;
    });

const planActiveValidation = body('active')
    .optional()
    .isBoolean()
    .withMessage('active debe ser un booleano');

// Validaciones para upgrades
const upgradeCodeValidation = body('code')
    .isString()
    .isLength({ min: 2, max: 20 })
    .matches(/^[A-Z_]+$/)
    .withMessage('El código debe contener solo letras mayúsculas y guiones bajos');

const upgradeNameValidation = body('name')
    .isString()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres');

const upgradeDurationHoursValidation = body('durationHours')
    .isInt({ min: 1 })
    .withMessage('durationHours debe ser un número entero positivo');

const upgradeRequiresValidation = body('requires')
    .optional()
    .isArray()
    .withMessage('requires debe ser un array')
    .custom((requires) => {
        if (requires) {
            for (const req of requires) {
                if (typeof req !== 'string' || req.length < 2) {
                    throw new Error('Cada requerimiento debe ser un string válido');
                }
            }
        }
        return true;
    });

const upgradeStackingPolicyValidation = body('stackingPolicy')
    .isIn(['extend', 'replace', 'reject'])
    .withMessage('stackingPolicy debe ser: extend, replace o reject');

const upgradeEffectValidation = body('effect')
    .isObject()
    .custom((effect) => {
        // Al menos uno de los campos debe estar presente
        const hasLevelDelta = typeof effect.levelDelta === 'number';
        const hasSetLevelTo = typeof effect.setLevelTo === 'number';
        const hasPriorityBonus = typeof effect.priorityBonus === 'number';
        const hasPositionRule = typeof effect.positionRule === 'string';
        
        if (!hasLevelDelta && !hasSetLevelTo && !hasPriorityBonus && !hasPositionRule) {
            throw new Error('El efecto debe tener al menos una propiedad válida');
        }
        
        // Validar levelDelta
        if (hasLevelDelta && (!Number.isInteger(effect.levelDelta) || Math.abs(effect.levelDelta) > 5)) {
            throw new Error('levelDelta debe ser un número entero entre -5 y 5');
        }
        
        // Validar setLevelTo
        if (hasSetLevelTo && (!Number.isInteger(effect.setLevelTo) || effect.setLevelTo < 1 || effect.setLevelTo > 5)) {
            throw new Error('setLevelTo debe ser un número entero entre 1 y 5');
        }
        
        // Validar priorityBonus
        if (hasPriorityBonus && typeof effect.priorityBonus !== 'number') {
            throw new Error('priorityBonus debe ser un número');
        }
        
        // Validar positionRule
        if (hasPositionRule && !['FRONT', 'BACK', 'BY_SCORE'].includes(effect.positionRule)) {
            throw new Error('positionRule debe ser: FRONT, BACK o BY_SCORE');
        }
        
        return true;
    });

const upgradeActiveValidation = body('active')
    .optional()
    .isBoolean()
    .withMessage('active debe ser un booleano');

// Validaciones de parámetros
const idParamValidation = param('id')
    .isMongoId()
    .withMessage('ID inválido');

const codeParamValidation = param('code')
    .isString()
    .isLength({ min: 2, max: 20 })
    .withMessage('Código inválido');

const levelParamValidation = param('level')
    .isInt({ min: 1, max: 5 })
    .withMessage('Nivel debe ser un número entre 1 y 5');

// Validaciones de query
const paginationValidation = [
    query('page').optional().isInt({ min: 1 }).withMessage('page debe ser un número entero positivo'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit debe ser un número entre 1 y 100'),
    query('sortBy').optional().isString().withMessage('sortBy debe ser un string'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('sortOrder debe ser asc o desc'),
    query('activeOnly').optional().isBoolean().withMessage('activeOnly debe ser un booleano')
];

// ==================== RUTAS DE PLANES ====================

// GET /api/plans - Obtener todos los planes
router.get('/', 
    paginationValidation,
    plansController.getAllPlans.bind(plansController)
);

// GET /api/plans/code/:code - Obtener plan por código
router.get('/code/:code', 
    codeParamValidation,
    plansController.getPlanByCode.bind(plansController)
);

// GET /api/plans/level/:level - Obtener planes por nivel
router.get('/level/:level', 
    levelParamValidation,
    query('activeOnly').optional().isBoolean(),
    plansController.getPlansByLevel.bind(plansController)
);

// ==================== RUTAS DE UPGRADES ====================

// GET /api/plans/upgrades - Obtener todos los upgrades
router.get('/upgrades', 
    paginationValidation,
    plansController.getAllUpgrades.bind(plansController)
);

// GET /api/upgrades/:id - Obtener upgrade por ID
router.get('/upgrades/:id', 
    idParamValidation,
    plansController.getUpgradeById.bind(plansController)
);

// GET /api/upgrades/code/:code - Obtener upgrade por código
router.get('/upgrades/code/:code', 
    codeParamValidation,
    plansController.getUpgradeByCode.bind(plansController)
);

// GET /api/upgrades/:code/dependency-tree - Obtener árbol de dependencias
router.get('/upgrades/:code/dependency-tree', 
    codeParamValidation,
    plansController.getUpgradeDependencyTree.bind(plansController)
);

// GET /api/plans/:id - Obtener plan por ID
router.get('/:id', 
    idParamValidation,
    plansController.getPlanById.bind(plansController)
);

// POST /api/plans - Crear nuevo plan
router.post('/', [
    planCodeValidation,
    planNameValidation,
    planLevelValidation,
    planVariantsValidation,
    planFeaturesValidation,
    planContentLimitsValidation,
    planIncludedUpgradesValidation,
    planActiveValidation
], plansController.createPlan.bind(plansController));

// PUT /api/plans/:id - Actualizar plan
router.put('/:id', [
    idParamValidation,
    planCodeValidation.optional(),
    planNameValidation.optional(),
    planLevelValidation.optional(),
    planVariantsValidation.optional(),
    planFeaturesValidation.optional(),
    planContentLimitsValidation.optional(),
    planIncludedUpgradesValidation,
    planActiveValidation
], plansController.updatePlan.bind(plansController));

// DELETE /api/plans/:id - Eliminar plan
router.delete('/:id', 
    idParamValidation,
    plansController.deletePlan.bind(plansController)
);

// GET /api/plans/:code/validate-upgrades - Validar upgrades de un plan
router.get('/:code/validate-upgrades', 
    codeParamValidation,
    plansController.validatePlanUpgrades.bind(plansController)
);

// POST /api/upgrades - Crear nuevo upgrade
router.post('/upgrades', [
    upgradeCodeValidation,
    upgradeNameValidation,
    upgradeDurationHoursValidation,
    upgradeRequiresValidation,
    upgradeStackingPolicyValidation,
    upgradeEffectValidation,
    upgradeActiveValidation
], plansController.createUpgrade.bind(plansController));

// PUT /api/upgrades/:id - Actualizar upgrade
router.put('/upgrades/:id', [
    idParamValidation,
    upgradeCodeValidation.optional(),
    upgradeNameValidation.optional(),
    upgradeDurationHoursValidation.optional(),
    upgradeRequiresValidation,
    upgradeStackingPolicyValidation.optional(),
    upgradeEffectValidation.optional(),
    upgradeActiveValidation
], plansController.updateUpgrade.bind(plansController));

// DELETE /api/upgrades/:id - Eliminar upgrade
router.delete('/upgrades/:id', 
    idParamValidation,
    plansController.deleteUpgrade.bind(plansController)
);

export default router;