import { PlanDefinitionModel } from '../plans/plan.model';
import { ProfileModel } from '../profile/profile.model';

/**
 * Errores de validación de negocio
 */
export class BusinessValidationError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 409,
    ) {
        super(message);
        this.name = 'BusinessValidationError';
    }
}

/**
 * Servicio de validaciones de negocio para evitar estados inválidos
 */
/**
 * Valida que un usuario no exceda el límite de 10 perfiles pagos
 * @param userId - ID del usuario
 * @param excludeProfileId - ID del perfil a excluir del conteo (para actualizaciones)
 */
export async function validatePaidProfileLimit(
    userId: string,
    excludeProfileId?: string,
): Promise<void> {
    const now = new Date();

    // Buscar perfiles pagos activos del usuario
    const query: any = {
        user: userId,
        'planAssignment.expiresAt': { $gt: now },
    };

    if (excludeProfileId) {
        query._id = { $ne: excludeProfileId };
    }

    const paidProfilesCount = await ProfileModel.countDocuments(query).exec();

    if (paidProfilesCount >= 10) {
        throw new BusinessValidationError(
            'No puedes tener más de 10 perfiles con plan pago activo',
            'PAID_PROFILE_LIMIT_EXCEEDED',
            409,
        );
    }
}

/**
 * Valida que un usuario no exceda el límite de 3 perfiles AMATISTA visibles
 * @param userId - ID del usuario
 * @param excludeProfileId - ID del perfil a excluir del conteo (para actualizaciones)
 */
export async function validateAmatistaLimit(
    userId: string,
    excludeProfileId?: string,
): Promise<void> {
    const now = new Date();

    // Buscar plan AMATISTA
    const amatistaPlan = await PlanDefinitionModel.findOne({
        name: 'AMATISTA',
    }).exec();
    if (!amatistaPlan) {
        throw new BusinessValidationError(
            'Plan AMATISTA no encontrado',
            'AMATISTA_PLAN_NOT_FOUND',
            500,
        );
    }

    // Buscar perfiles AMATISTA visibles del usuario
    const query: any = {
        user: userId,
        visible: true,
        'planAssignment.planId': amatistaPlan._id,
        'planAssignment.expiresAt': { $gt: now },
    };

    if (excludeProfileId) {
        query._id = { $ne: excludeProfileId };
    }

    const amatistaProfilesCount = await ProfileModel.countDocuments(query).exec();

    if (amatistaProfilesCount >= 3) {
        throw new BusinessValidationError(
            'No puedes tener más de 3 perfiles AMATISTA visibles simultáneamente',
            'AMATISTA_LIMIT_EXCEEDED',
            409,
        );
    }
}

/**
 * Valida que un perfil pueda recibir upgrades
 * @param profileId - ID del perfil
 */
export async function validateUpgradeEligibility(
    profileId: string,
): Promise<void> {
    const profile = await ProfileModel.findById(profileId).exec();

    if (!profile) {
        throw new BusinessValidationError(
            'Perfil no encontrado',
            'PROFILE_NOT_FOUND',
            404,
        );
    }

    // Validar que el perfil esté visible
    if (!profile.visible) {
        throw new BusinessValidationError(
            'No se pueden comprar upgrades para perfiles no visibles',
            'PROFILE_NOT_VISIBLE',
            409,
        );
    }

    // Validar que tenga un plan vigente
    const now = new Date();
    if (!profile.planAssignment || profile.planAssignment.expiresAt <= now) {
        throw new BusinessValidationError(
            'No se pueden comprar upgrades para perfiles sin plan vigente',
            'NO_ACTIVE_PLAN',
            409,
        );
    }
}

/**
 * Valida idempotencia en compras usando orderId
 * @param userId - ID del usuario
 * @param orderId - ID único de la orden
 * @param operationType - Tipo de operación (plan, upgrade)
 */
export async function validatePurchaseIdempotency(
    userId: string,
    orderId: string,
    operationType: 'plan' | 'upgrade',
): Promise<void> {
    // Buscar si ya existe una transacción con este orderId
    const existingTransaction = await ProfileModel.findOne({
        user: userId,
        $or: [
            { 'planAssignment.orderId': orderId },
            { 'upgrades.orderId': orderId },
        ],
    }).exec();

    if (existingTransaction) {
        throw new BusinessValidationError(
            `Ya existe una transacción con el ID de orden: ${orderId}`,
            'DUPLICATE_ORDER_ID',
            409,
        );
    }
}

/**
 * Valida que un usuario pueda asignar un plan pago
 * Combina validaciones de límites e idempotencia
 * @param userId - ID del usuario
 * @param planCode - Código del plan
 * @param profileId - ID del perfil (opcional, para actualizaciones)
 * @param orderId - ID único de la orden (opcional)
 */
export async function validatePaidPlanAssignment(
    userId: string,
    planCode: string,
    profileId?: string,
    orderId?: string,
): Promise<void> {
    // Validar idempotencia si se proporciona orderId
    if (orderId) {
        await validatePurchaseIdempotency(userId, orderId, 'plan');
    }

    // Obtener el plan para verificar si es pago
    const plan = await PlanDefinitionModel.findOne({ code: planCode }).exec();
    if (!plan) {
        throw new BusinessValidationError(
            `Plan con código ${planCode} no encontrado`,
            'PLAN_NOT_FOUND',
        );
    }

    // Verificar si el plan es pago (tiene variantes con precio > 0)
    const isPaidPlan = plan.variants.some((variant) => variant.price > 0);
    if (isPaidPlan) {
        await validatePaidProfileLimit(userId, profileId);
    }

    // Validación específica para AMATISTA
    if (planCode === 'AMATISTA') {
        await validateAmatistaLimit(userId, profileId);
    }
}

/**
 * Valida que un usuario pueda comprar un upgrade
 * @param userId - ID del usuario
 * @param profileId - ID del perfil
 * @param upgradeCode - Código del upgrade
 * @param orderId - ID de la orden (opcional, para idempotencia)
 */
export async function validateUpgradePurchase(
    userId: string,
    profileId: string,
    upgradeCode: string,
    orderId?: string,
): Promise<void> {
    // Validar idempotencia si se proporciona orderId
    if (orderId) {
        await validatePurchaseIdempotency(userId, orderId, 'upgrade');
    }

    // Validar elegibilidad del perfil para upgrades
    await validateUpgradeEligibility(profileId);

    // Verificar que el perfil pertenezca al usuario
    const profile = await ProfileModel.findOne({
        _id: profileId,
        user: userId,
    }).exec();
    if (!profile) {
        throw new BusinessValidationError(
            'Perfil no encontrado o no pertenece al usuario',
            'PROFILE_ACCESS_DENIED',
            403,
        );
    }

    // Verificar reglas específicas por tipo de upgrade
    if (upgradeCode === 'DESTACADO' && profile.planAssignment?.planCode === 'DIAMANTE') {
        throw new BusinessValidationError(
            'El plan Diamante ya incluye "Destacado" permanente',
            'UPGRADE_ALREADY_INCLUDED',
            409,
        );
    }

    // Verificar si ya tiene el upgrade activo
    const now = new Date();
    const activeUpgrades = profile.upgrades?.filter(u => new Date(u.endAt) > now) || [];
    const hasUpgradeActive = activeUpgrades.some(u => u.code === upgradeCode);
    
    if (hasUpgradeActive) {
        throw new BusinessValidationError(
            `El upgrade ${upgradeCode} ya está activo`,
            'UPGRADE_ALREADY_ACTIVE',
            409,
        );
    }

    // Verificar dependencias para IMPULSO
    if (upgradeCode === 'IMPULSO') {
        const hasDestacado = activeUpgrades.some(u => u.code === 'DESTACADO') || 
                            profile.planAssignment?.planCode === 'DIAMANTE';
        
        if (!hasDestacado) {
            throw new BusinessValidationError(
                'Necesitas tener "Destacado" activo para comprar "Impulso"',
                'MISSING_UPGRADE_DEPENDENCY',
                409,
            );
        }
    }
}

/**
 * Obtiene estadísticas de uso del usuario para debugging
 * @param userId - ID del usuario
 */
export async function getUserUsageStats(userId: string): Promise<{
    totalProfiles: number;
    paidProfiles: number;
    amatistaProfiles: number;
    visibleProfiles: number;
}> {
    const now = new Date();

    // Obtener plan AMATISTA
    const amatistaPlan = await PlanDefinitionModel.findOne({
        name: 'AMATISTA',
    }).exec();

    const [totalProfiles, paidProfiles, amatistaProfiles, visibleProfiles] =
        await Promise.all([
            ProfileModel.countDocuments({ user: userId }).exec(),
            ProfileModel.countDocuments({
                user: userId,
                'planAssignment.expiresAt': { $gt: now },
            }).exec(),
            amatistaPlan
                ? ProfileModel.countDocuments({
                    user: userId,
                    visible: true,
                    'planAssignment.planId': amatistaPlan._id,
                    'planAssignment.expiresAt': { $gt: now },
                }).exec()
                : 0,
            ProfileModel.countDocuments({
                user: userId,
                visible: true,
            }).exec(),
        ]);

    return {
        totalProfiles,
        paidProfiles,
        amatistaProfiles,
        visibleProfiles,
    };
}
