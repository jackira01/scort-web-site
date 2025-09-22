"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const plans_controller_1 = require("./plans.controller");
const router = (0, express_1.Router)();
const planCodeValidation = (0, express_validator_1.body)('code')
    .isString()
    .isLength({ min: 2, max: 20 })
    .matches(/^[A-Z_]+$/)
    .withMessage('El código debe contener solo letras mayúsculas y guiones bajos');
const planNameValidation = (0, express_validator_1.body)('name')
    .isString()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres');
const planLevelValidation = (0, express_validator_1.body)('level')
    .isInt({ min: 1, max: 5 })
    .withMessage('El nivel debe ser un número entero entre 1 y 5');
const planVariantsValidation = (0, express_validator_1.body)('variants')
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
const planFeaturesValidation = (0, express_validator_1.body)('features')
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
const planContentLimitsValidation = (0, express_validator_1.body)('contentLimits')
    .isObject()
    .custom((limits) => {
    if (!limits.photos || typeof limits.photos !== 'object') {
        throw new Error('contentLimits.photos es requerido y debe ser un objeto');
    }
    if (!Number.isInteger(limits.photos.min) || limits.photos.min < 0) {
        throw new Error('contentLimits.photos.min debe ser un número entero >= 0');
    }
    if (!Number.isInteger(limits.photos.max) || limits.photos.max < limits.photos.min) {
        throw new Error('contentLimits.photos.max debe ser un número entero >= min');
    }
    if (!limits.videos || typeof limits.videos !== 'object') {
        throw new Error('contentLimits.videos es requerido y debe ser un objeto');
    }
    if (!Number.isInteger(limits.videos.min) || limits.videos.min < 0) {
        throw new Error('contentLimits.videos.min debe ser un número entero >= 0');
    }
    if (!Number.isInteger(limits.videos.max) || limits.videos.max < limits.videos.min) {
        throw new Error('contentLimits.videos.max debe ser un número entero >= min');
    }
    if (!Number.isInteger(limits.storiesPerDayMax) || limits.storiesPerDayMax < 0) {
        throw new Error('contentLimits.storiesPerDayMax debe ser un número entero >= 0');
    }
    return true;
});
const planIncludedUpgradesValidation = (0, express_validator_1.body)('includedUpgrades')
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
const planActiveValidation = (0, express_validator_1.body)('active')
    .optional()
    .isBoolean()
    .withMessage('active debe ser un booleano');
const upgradeCodeValidation = (0, express_validator_1.body)('code')
    .isString()
    .isLength({ min: 2, max: 20 })
    .matches(/^[A-Z_]+$/)
    .withMessage('El código debe contener solo letras mayúsculas y guiones bajos');
const upgradeNameValidation = (0, express_validator_1.body)('name')
    .isString()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres');
const upgradeDurationHoursValidation = (0, express_validator_1.body)('durationHours')
    .isInt({ min: 1 })
    .withMessage('durationHours debe ser un número entero positivo');
const upgradeRequiresValidation = (0, express_validator_1.body)('requires')
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
const upgradeStackingPolicyValidation = (0, express_validator_1.body)('stackingPolicy')
    .isIn(['extend', 'replace', 'reject'])
    .withMessage('stackingPolicy debe ser: extend, replace o reject');
const upgradeEffectValidation = (0, express_validator_1.body)('effect')
    .isObject()
    .custom((effect) => {
    const hasLevelDelta = typeof effect.levelDelta === 'number';
    const hasSetLevelTo = typeof effect.setLevelTo === 'number';
    const hasPriorityBonus = typeof effect.priorityBonus === 'number';
    const hasPositionRule = typeof effect.positionRule === 'string';
    if (!hasLevelDelta && !hasSetLevelTo && !hasPriorityBonus && !hasPositionRule) {
        throw new Error('El efecto debe tener al menos una propiedad válida');
    }
    if (hasLevelDelta && (!Number.isInteger(effect.levelDelta) || Math.abs(effect.levelDelta) > 5)) {
        throw new Error('levelDelta debe ser un número entero entre -5 y 5');
    }
    if (hasSetLevelTo && (!Number.isInteger(effect.setLevelTo) || effect.setLevelTo < 1 || effect.setLevelTo > 5)) {
        throw new Error('setLevelTo debe ser un número entero entre 1 y 5');
    }
    if (hasPriorityBonus && typeof effect.priorityBonus !== 'number') {
        throw new Error('priorityBonus debe ser un número');
    }
    if (hasPositionRule && !['FRONT', 'BACK', 'BY_SCORE'].includes(effect.positionRule)) {
        throw new Error('positionRule debe ser: FRONT, BACK o BY_SCORE');
    }
    return true;
});
const upgradeActiveValidation = (0, express_validator_1.body)('active')
    .optional()
    .isBoolean()
    .withMessage('active debe ser un booleano');
const idParamValidation = (0, express_validator_1.param)('id')
    .isMongoId()
    .withMessage('ID inválido');
const codeParamValidation = (0, express_validator_1.param)('code')
    .isString()
    .isLength({ min: 2, max: 20 })
    .withMessage('Código inválido');
const levelParamValidation = (0, express_validator_1.param)('level')
    .isInt({ min: 1, max: 5 })
    .withMessage('Nivel debe ser un número entre 1 y 5');
const paginationValidation = [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('page debe ser un número entero positivo'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit debe ser un número entre 1 y 100'),
    (0, express_validator_1.query)('sortBy').optional().isString().withMessage('sortBy debe ser un string'),
    (0, express_validator_1.query)('sortOrder').optional().isIn(['asc', 'desc']).withMessage('sortOrder debe ser asc o desc'),
    (0, express_validator_1.query)('activeOnly').optional().isBoolean().withMessage('activeOnly debe ser un booleano')
];
router.get('/', paginationValidation, plans_controller_1.plansController.getAllPlans.bind(plans_controller_1.plansController));
router.get('/code/:code', codeParamValidation, plans_controller_1.plansController.getPlanByCode.bind(plans_controller_1.plansController));
router.get('/level/:level', levelParamValidation, (0, express_validator_1.query)('activeOnly').optional().isBoolean(), plans_controller_1.plansController.getPlansByLevel.bind(plans_controller_1.plansController));
router.get('/upgrades', paginationValidation, plans_controller_1.plansController.getAllUpgrades.bind(plans_controller_1.plansController));
router.get('/upgrades/:id', idParamValidation, plans_controller_1.plansController.getUpgradeById.bind(plans_controller_1.plansController));
router.get('/upgrades/code/:code', codeParamValidation, plans_controller_1.plansController.getUpgradeByCode.bind(plans_controller_1.plansController));
router.get('/upgrades/:code/dependency-tree', codeParamValidation, plans_controller_1.plansController.getUpgradeDependencyTree.bind(plans_controller_1.plansController));
router.get('/:id', idParamValidation, plans_controller_1.plansController.getPlanById.bind(plans_controller_1.plansController));
router.post('/', [
    planCodeValidation,
    planNameValidation,
    planLevelValidation,
    planVariantsValidation,
    planFeaturesValidation,
    planContentLimitsValidation,
    planIncludedUpgradesValidation,
    planActiveValidation
], plans_controller_1.plansController.createPlan.bind(plans_controller_1.plansController));
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
], plans_controller_1.plansController.updatePlan.bind(plans_controller_1.plansController));
router.delete('/:id', idParamValidation, plans_controller_1.plansController.deletePlan.bind(plans_controller_1.plansController));
router.post('/upgrades', [
    upgradeCodeValidation,
    upgradeNameValidation,
    upgradeDurationHoursValidation,
    upgradeRequiresValidation,
    upgradeStackingPolicyValidation,
    upgradeEffectValidation,
    upgradeActiveValidation
], plans_controller_1.plansController.createUpgrade.bind(plans_controller_1.plansController));
router.put('/upgrades/:id', [
    idParamValidation,
    upgradeCodeValidation.optional(),
    upgradeNameValidation.optional(),
    upgradeDurationHoursValidation.optional(),
    upgradeRequiresValidation,
    upgradeStackingPolicyValidation.optional(),
    upgradeEffectValidation.optional(),
    upgradeActiveValidation
], plans_controller_1.plansController.updateUpgrade.bind(plans_controller_1.plansController));
router.delete('/upgrades/:id', idParamValidation, plans_controller_1.plansController.deleteUpgrade.bind(plans_controller_1.plansController));
router.post('/purchase', [
    (0, express_validator_1.body)('profileId').isMongoId().withMessage('profileId debe ser un ID válido de MongoDB'),
    (0, express_validator_1.body)('planCode').isString().isLength({ min: 2, max: 20 }).withMessage('planCode debe ser un string válido'),
    (0, express_validator_1.body)('variantDays').notEmpty().withMessage('variantDays es requerido').isInt({ min: 1 }).withMessage('variantDays debe ser un número entero positivo')
], plans_controller_1.plansController.purchasePlan.bind(plans_controller_1.plansController));
router.post('/renew', [
    (0, express_validator_1.body)('profileId').isMongoId().withMessage('profileId debe ser un ID válido de MongoDB'),
    (0, express_validator_1.body)('extensionDays').isInt({ min: 1 }).withMessage('extensionDays debe ser un número entero positivo')
], plans_controller_1.plansController.renewPlan.bind(plans_controller_1.plansController));
exports.default = router;
