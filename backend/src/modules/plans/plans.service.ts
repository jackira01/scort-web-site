import { PlanDefinitionModel, IPlanDefinition, PlanVariant, PlanFeatures, ContentLimits } from './plan.model';
import { UpgradeDefinitionModel, IUpgradeDefinition, StackingPolicy, UpgradeEffect } from './upgrade.model';
import { ProfileModel } from '../profile/profile.model';
import UserModel from '../user/User.model';
import { ConfigParameterService } from '../config-parameter/config-parameter.service';
import InvoiceService from '../payments/invoice.service';
import { Types } from 'mongoose';

/**
 * Limpia upgrades expirados y elimina duplicados del mismo tipo
 * Mantiene solo el upgrade más reciente de cada tipo
 */
const cleanProfileUpgrades = (profile: any): void => {
    const now = new Date();
    const upgradeMap = new Map<string, any>();

    // Filtrar upgrades expirados y mantener solo el más reciente de cada tipo
    for (const upgrade of profile.upgrades) {
        // Saltar upgrades expirados
        if (upgrade.endAt <= now) {
            continue;
        }

        const existing = upgradeMap.get(upgrade.code);

        // Si no existe o el actual es más reciente, guardarlo
        if (!existing || upgrade.purchaseAt > existing.purchaseAt) {
            upgradeMap.set(upgrade.code, upgrade);
        }
    }

    // Reemplazar el array de upgrades con los upgrades limpios
    profile.upgrades = Array.from(upgradeMap.values());
};

// Interfaz para el mensaje de WhatsApp
export interface WhatsAppMessage {
    userId: string;
    profileId: string;
    company: string;
    companyNumber: string;
    message: string;
}

// Interfaces para crear/actualizar planes
export interface CreatePlanInput {
    code: string;
    name: string;
    description?: string; // Descripción del plan (opcional)
    level: number;
    variants: PlanVariant[];
    features: PlanFeatures;
    contentLimits: ContentLimits;
    includedUpgrades?: string[];
    active?: boolean;
}

export interface UpdatePlanInput {
    name?: string;
    description?: string; // Descripción del plan (opcional)
    level?: number;
    variants?: PlanVariant[];
    features?: PlanFeatures;
    contentLimits?: ContentLimits;
    includedUpgrades?: string[];
    active?: boolean;
}

// Interfaces para crear/actualizar upgrades
export interface CreateUpgradeInput {
    code: string;
    name: string;
    durationHours?: number;
    price?: number;
    requires?: string[];
    stackingPolicy?: StackingPolicy;
    effect: UpgradeEffect;
    active?: boolean;
}

export interface UpdateUpgradeInput {
    name?: string;
    durationHours?: number;
    price?: number;
    requires?: string[];
    stackingPolicy?: StackingPolicy;
    effect?: UpgradeEffect;
    active?: boolean;
}

export interface QueryOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    isActive?: boolean;
    search?: string;
}

// Interfaz para información del cupón
interface CouponInfo {
    code: string;
    name: string;
    type: string;
    value: number;
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
}

// Función helper para generar mensaje de WhatsApp
const generateWhatsAppMessage = async (
    userId: string,
    profileId: string,
    planCode?: string,
    variantDays?: number,
    invoiceId?: string,
    invoiceNumber?: string,
    isRenewal?: boolean,
    price?: number,
    expiresAt?: Date,
    couponInfo?: CouponInfo
): Promise<WhatsAppMessage | null> => {
    try {
        const [companyName, companyWhatsApp, user, fullProfile] = await Promise.all([
            ConfigParameterService.getValue('company.name'),
            ConfigParameterService.getValue('company.whatsapp.number'),
            UserModel.findById(userId).select('name'),
            ProfileModel.findById(profileId).select('name planAssignment').populate('planAssignment.planId')
        ]);

        if (!companyName || !companyWhatsApp) {
            return null;
        }

        // Obtener plan actual del perfil
        let currentPlanInfo = 'Sin plan';
        if (fullProfile?.planAssignment?.planId) {
            const currentPlan = fullProfile.planAssignment.planId as any;
            currentPlanInfo = currentPlan.name || currentPlan.code || 'Plan desconocido';
        } else if (fullProfile?.planAssignment?.planCode) {
            currentPlanInfo = fullProfile.planAssignment.planCode;
        }

        // Información del producto/servicio a adquirir
        let productInfo = '';
        if (planCode && variantDays) {
            const plan = await PlanDefinitionModel.findOne({ code: planCode });
            const planName = plan?.name || planCode;
            productInfo = `${planName} (${variantDays} días)`;
        }

        // Información de cupón si existe
        let couponLine = '';
        if (couponInfo) {
            couponLine = `\n• Cupón: ${couponInfo.code} - Descuento: $${(couponInfo.discountAmount || 0).toFixed(2)}`;
        }

        // Generar mensaje con nueva estructura
        const userName = user?.name || 'Cliente';
        const profileName = fullProfile?.name || profileId;

        const message = `¡Hola prepagoYA.com! \n\nEspero que estén muy bien. Acabo de adquirir un paquete en su plataforma y me gustaría conocer las opciones disponibles para realizar el pago. \n\n *Detalles de Compra:*\n• Usuario: ${userName}\n• Perfil: ${profileName}\n• Plan Actual: ${currentPlanInfo}${invoiceNumber ? `\n• Factura: ${invoiceNumber}` : ''}${productInfo ? `\n• Productos/Servicios: ${productInfo}` : ''}${couponLine}\n\nGracias por tu compra.`;

        return {
            userId,
            profileId,
            company: companyName,
            companyNumber: companyWhatsApp,
            message
        };
    } catch (error) {
        return null;
    }
};

export class PlansService {
    // ==================== PLANES ====================

    async createPlan(planData: CreatePlanInput): Promise<IPlanDefinition> {
        try {
            // Validar que los upgrades incluidos existan
            if (planData.includedUpgrades && planData.includedUpgrades.length > 0) {
                for (const upgradeCode of planData.includedUpgrades) {
                    const upgrade = await UpgradeDefinitionModel.findByCode(upgradeCode);
                    if (!upgrade) {
                        throw new Error(`El upgrade '${upgradeCode}' no existe`);
                    }
                }
            }

            const plan = new PlanDefinitionModel(planData);
            return await plan.save();
        } catch (error: any) {
            if (error.code === 11000) {
                throw new Error(`El código '${planData.code}' ya existe`);
            }
            throw error;
        }
    }

    async getAllPlans(options: QueryOptions = {}): Promise<{
        plans: IPlanDefinition[];
        total: number;
        page: number;
        totalPages: number;
    }> {
        const {
            page = 1,
            limit = 10,
            sortBy = 'level',
            sortOrder = 'asc',
            isActive,
            search
        } = options;

        const query: any = {};

        // Filtro por estado activo: si isActive está definido, filtrar; si no, mostrar todos
        if (isActive !== undefined) {
            query.active = isActive;
        }

        // Filtro de búsqueda
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } }
            ];
        }

        const sort: any = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const skip = (page - 1) * limit;

        const [plans, total] = await Promise.all([
            PlanDefinitionModel.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .exec(),
            PlanDefinitionModel.countDocuments(query)
        ]);

        return {
            plans,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    async getPlanById(id: string): Promise<IPlanDefinition | null> {
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('ID de plan inválido');
        }
        return await PlanDefinitionModel.findById(id);
    }

    async getPlanByCode(code: string): Promise<IPlanDefinition | null> {
        return await PlanDefinitionModel.findByCode(code);
    }

    async getPlansByLevel(level: number, activeOnly: boolean = true): Promise<IPlanDefinition[]> {
        return await PlanDefinitionModel.findByLevel(level, activeOnly);
    }

    async updatePlan(id: string, updateData: UpdatePlanInput): Promise<IPlanDefinition | null> {
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('ID de plan inválido');
        }

        // Validar que los upgrades incluidos existan
        if (updateData.includedUpgrades && updateData.includedUpgrades.length > 0) {
            for (const upgradeCode of updateData.includedUpgrades) {
                const upgrade = await UpgradeDefinitionModel.findByCode(upgradeCode);
                if (!upgrade) {
                    throw new Error(`El upgrade '${upgradeCode}' no existe`);
                }
            }
        }

        return await PlanDefinitionModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
    }

    async deletePlan(id: string): Promise<boolean> {
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('ID de plan inválido');
        }

        const result = await PlanDefinitionModel.findByIdAndDelete(id);
        return result !== null;
    }

    // ==================== UPGRADES ====================

    async createUpgrade(upgradeData: CreateUpgradeInput): Promise<IUpgradeDefinition> {
        try {
            const upgrade = new UpgradeDefinitionModel(upgradeData);

            // Validar dependencias circulares
            const isValid = await (upgrade as any).validateCircularDependency();
            if (!isValid) {
                throw new Error('Dependencia circular detectada en los upgrades');
            }

            return await upgrade.save();
        } catch (error: any) {
            if (error.code === 11000) {
                throw new Error(`El código '${upgradeData.code}' ya existe`);
            }
            throw error;
        }
    }

    async getAllUpgrades(options: QueryOptions = {}): Promise<{
        upgrades: IUpgradeDefinition[];
        total: number;
        page: number;
        totalPages: number;
    }> {
        const {
            page = 1,
            limit = 10,
            sortBy = 'code',
            sortOrder = 'asc',
            isActive
        } = options;

        const query: any = {};

        // Filtro por estado activo: si isActive está definido, filtrar; si no, mostrar todos
        if (isActive !== undefined) {
            query.active = isActive;
        }

        const sort: any = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const skip = (page - 1) * limit;

        const [upgrades, total] = await Promise.all([
            UpgradeDefinitionModel.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .exec(),
            UpgradeDefinitionModel.countDocuments(query)
        ]);

        return {
            upgrades,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    async getUpgradeById(id: string): Promise<IUpgradeDefinition | null> {
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('ID de upgrade inválido');
        }
        return await UpgradeDefinitionModel.findById(id);
    }

    async getUpgradeByCode(code: string): Promise<IUpgradeDefinition | null> {
        return await UpgradeDefinitionModel.findByCode(code);
    }

    async getUpgradesByRequirement(requirementCode: string, activeOnly: boolean = true): Promise<IUpgradeDefinition[]> {
        return await UpgradeDefinitionModel.findByRequirement(requirementCode, activeOnly);
    }

    async updateUpgrade(id: string, updateData: UpdateUpgradeInput): Promise<IUpgradeDefinition | null> {
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('ID de upgrade inválido');
        }

        // Si se están actualizando los requirements, validar dependencias circulares
        if (updateData.requires) {
            const upgrade = await UpgradeDefinitionModel.findById(id);
            if (upgrade) {
                const tempUpgrade = { ...upgrade.toObject(), ...updateData };
                const testUpgrade = new UpgradeDefinitionModel(tempUpgrade);
                const isValid = await (testUpgrade as any).validateCircularDependency();
                if (!isValid) {
                    throw new Error('La actualización crearía una dependencia circular');
                }
            }
        }

        return await UpgradeDefinitionModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
    }

    async deleteUpgrade(id: string): Promise<boolean> {
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('ID de upgrade inválido');
        }

        // Verificar si el upgrade está siendo usado por algún plan
        const upgrade = await UpgradeDefinitionModel.findById(id);
        if (upgrade) {
            const plansUsingUpgrade = await PlanDefinitionModel.find({
                includedUpgrades: upgrade.code
            });

            if (plansUsingUpgrade.length > 0) {
                const planNames = plansUsingUpgrade.map(p => p.name).join(', ');
                throw new Error(`No se puede eliminar el upgrade '${upgrade.code}' porque está siendo usado por los planes: ${planNames}`);
            }

            // Verificar si otros upgrades lo requieren
            const dependentUpgrades = await UpgradeDefinitionModel.findByRequirement(upgrade.code);
            if (dependentUpgrades.length > 0) {
                const upgradeNames = dependentUpgrades.map(u => u.name).join(', ');
                throw new Error(`No se puede eliminar el upgrade '${upgrade.code}' porque es requerido por: ${upgradeNames}`);
            }
        }

        const result = await UpgradeDefinitionModel.findByIdAndDelete(id);
        return result !== null;
    }

    // ==================== UTILIDADES ====================

    async getUpgradeDependencyTree(upgradeCode: string): Promise<{
        upgrade: IUpgradeDefinition;
        dependencies: IUpgradeDefinition[];
        dependents: IUpgradeDefinition[];
    } | null> {
        const upgrade = await UpgradeDefinitionModel.findByCode(upgradeCode);
        if (!upgrade) {
            return null;
        }

        const dependencies: IUpgradeDefinition[] = [];
        for (const reqCode of upgrade.requires) {
            const dep = await UpgradeDefinitionModel.findByCode(reqCode);
            if (dep) dependencies.push(dep);
        }

        const dependents = await UpgradeDefinitionModel.findByRequirement(upgradeCode);

        return {
            upgrade,
            dependencies,
            dependents
        };
    }

    // ==================== OPERACIONES DE PLANES ====================

    async purchasePlan(profileId: string, planCode: string, variantDays: number, isAdmin: boolean = false, generateInvoice: boolean = true): Promise<{
        profileId: string;
        planCode: string;
        variantDays: number;
        expiresAt: Date;
        purchaseAt: Date;
        price: number;
        invoiceId?: string;
        whatsAppMessage?: WhatsAppMessage | null;
    }> {
        // Verificar que el perfil existe
        const profile = await ProfileModel.findById(profileId);
        if (!profile) {
            throw new Error('Perfil no encontrado');
        }

        // Verificar que el plan existe
        const plan = await PlanDefinitionModel.findOne({ code: planCode, active: true });
        if (!plan) {
            throw new Error('Plan no encontrado o inactivo');
        }

        // Verificar que la variante existe
        const variant = plan.variants.find(v => v.days === variantDays);
        if (!variant) {
            throw new Error('Variante de plan no encontrada');
        }

        // Verificar si el perfil ya tiene un plan activo
        const now = new Date();
        if (profile.planAssignment && profile.planAssignment.expiresAt > now) {
            throw new Error('El perfil ya tiene un plan activo. No se puede comprar otro plan hasta que expire el actual.');
        }

        // Calcular fecha de expiración
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + variantDays);

        // Generar factura si el plan tiene precio y NO es admin con asignación directa
        let invoiceId: string | undefined;
        let invoiceNumber: string | undefined;
        let invoiceCouponInfo: CouponInfo | undefined;

        if (variant.price > 0 && (!isAdmin || generateInvoice)) {
            try {
                const invoice = await InvoiceService.generateInvoice({
                    userId: profile.user.toString(),
                    profileId: profileId,
                    planCode: planCode,
                    planDays: variantDays,
                    upgradeCodes: []
                });
                invoiceId = invoice.id;
                invoiceNumber = String(invoice.invoiceNumber);

                // Capturar información del cupón si existe
                if (invoice.coupon &&
                    invoice.coupon.code &&
                    invoice.coupon.originalAmount !== undefined &&
                    invoice.coupon.discountAmount !== undefined &&
                    invoice.coupon.finalAmount !== undefined) {
                    invoiceCouponInfo = {
                        code: invoice.coupon.code,
                        name: invoice.coupon.name || '',
                        type: invoice.coupon.type || '',
                        value: invoice.coupon.value || 0,
                        originalAmount: invoice.coupon.originalAmount,
                        discountAmount: invoice.coupon.discountAmount,
                        finalAmount: invoice.coupon.finalAmount
                    };
                }

                // Agregar factura al historial de pagos del perfil
                profile.paymentHistory.push(new Types.ObjectId(invoice._id as string));

                // Mantener perfil inactivo hasta que se pague la factura
                profile.isActive = false;

                // NO asignar el plan hasta que se pague - solo marcar como pendiente
                // Usar fechas temporales que serán actualizadas cuando se confirme el pago
                const tempDate = new Date('1970-01-01'); // Fecha temporal para indicar pendiente
                profile.planAssignment = {
                    planId: plan._id as Types.ObjectId,           // Referencia al _id del plan
                    planCode: planCode,         // Mantener para compatibilidad
                    variantDays: variantDays,
                    startAt: tempDate, // Se asignará cuando se pague
                    expiresAt: tempDate // Se calculará cuando se pague
                };

                await profile.save();

            } catch (error) {
                // Error creando factura para compra de plan
                throw new Error('Error al generar factura para el plan');
            }
        } else {
            // Plan gratuito o usuario admin con asignación directa - asignar inmediatamente
            profile.planAssignment = {
                planId: plan._id as Types.ObjectId,           // Referencia al _id del plan
                planCode: planCode,         // Mantener para compatibilidad
                variantDays: variantDays,
                startAt: now,
                expiresAt: expiresAt
            };

            // Activar el perfil inmediatamente para admins con asignación directa o planes gratuitos
            profile.isActive = true;

            // Limpiar upgrades expirados y duplicados antes de agregar nuevos
            cleanProfileUpgrades(profile);

            // Generar upgrades incluidos en el plan (sincronizados con la expiración del plan)
            if (plan.includedUpgrades && plan.includedUpgrades.length > 0) {
                const planUpgrades = plan.includedUpgrades.map((code: string) => ({
                    code,
                    startAt: now,
                    endAt: expiresAt, // La fecha de fin se sincroniza con la del plan
                    purchaseAt: now,
                    isVisible: true
                }));

                // Fusionar con upgrades existentes (priorizando los nuevos del plan)
                const newCodes = planUpgrades.map((u: any) => u.code);
                const kept = (profile.upgrades || []).filter(u => !newCodes.includes(u.code));
                profile.upgrades = [...kept, ...planUpgrades];

                console.log(`✅ Upgrades sincronizados con el plan en purchasePlan: ${plan.includedUpgrades.join(', ')}`);
            }

            profile.isActive = true;
            await profile.save();
        }

        // Generar mensaje de WhatsApp para renovación
        const whatsAppMessage = await generateWhatsAppMessage(
            profile.user.toString(),
            profileId,
            planCode,
            variantDays,
            invoiceId,
            invoiceNumber,
            true, // isRenewal = true
            variant.price,
            expiresAt,
            invoiceCouponInfo
        );

        return {
            profileId,
            planCode,
            variantDays,
            expiresAt,
            purchaseAt: now,
            price: variant.price,
            invoiceId,
            whatsAppMessage
        };
    }

    async renewPlan(profileId: string, planCode: string, variantDays: number, isAdmin: boolean = false): Promise<{
        profileId: string;
        planCode: string;
        variantDays: number;
        previousExpiresAt: Date;
        newExpiresAt: Date;
        renewedAt: Date;
        price: number;
        invoiceId?: string;
        whatsAppMessage?: WhatsAppMessage | null;
    }> {

        // Verificar que el perfil existe
        const profile = await ProfileModel.findById(profileId);
        if (!profile) {
            throw new Error('Perfil no encontrado');
        }

        // Verificar que el plan existe
        const plan = await PlanDefinitionModel.findOne({ code: planCode, active: true });
        if (!plan) {
            throw new Error('Plan no encontrado o inactivo');
        }

        // Verificar que la variante existe
        const variant = plan.variants.find(v => v.days === variantDays);
        if (!variant) {
            throw new Error('Variante de plan no encontrada');
        }

        // Verificar si el perfil tiene un plan del mismo tipo (activo o expirado)
        if (!profile.planAssignment || profile.planAssignment.planCode !== planCode) {
            throw new Error('El perfil no tiene un plan del tipo especificado para renovar');
        }

        // Extender la fecha de expiración desde la fecha actual de expiración o desde ahora si ya expiró
        const currentExpiresAt = profile.planAssignment.expiresAt;
        const now = new Date();

        // CAMBIO: Si es admin, siempre resetear la fecha de inicio a ahora y la expiración a ahora + días
        // Esto permite "corregir" o "asignar" un plan desde cero incluso si ya existe
        let newExpiresAt: Date;

        if (isAdmin) {
            // Resetear fechas para admin
            newExpiresAt = new Date(now.getTime() + (variantDays * 24 * 60 * 60 * 1000));
            // Actualizar también startAt para reflejar el reset
            profile.planAssignment.startAt = now;
        } else {
            // Comportamiento normal de renovación (extensión)
            const baseDate = currentExpiresAt > now ? currentExpiresAt : now;
            newExpiresAt = new Date(baseDate);
            newExpiresAt.setDate(newExpiresAt.getDate() + variantDays);
        }

        // Generar factura si el plan tiene precio y NO es admin
        let invoiceId: string | undefined;
        let invoiceNumber: string | undefined;
        let invoiceCouponInfo: CouponInfo | undefined;

        if (variant.price > 0 && !isAdmin) {
            try {
                const invoice = await InvoiceService.generateInvoice({
                    userId: profile.user.toString(),
                    profileId: profileId,
                    planCode: planCode,
                    planDays: variantDays,
                    upgradeCodes: []
                });
                invoiceId = invoice.id;
                invoiceNumber = String(invoice.invoiceNumber);

                // Capturar información del cupón si existe
                if (invoice.coupon &&
                    invoice.coupon.code &&
                    invoice.coupon.originalAmount !== undefined &&
                    invoice.coupon.discountAmount !== undefined &&
                    invoice.coupon.finalAmount !== undefined) {
                    invoiceCouponInfo = {
                        code: invoice.coupon.code,
                        name: invoice.coupon.name || '',
                        type: invoice.coupon.type || '',
                        value: invoice.coupon.value || 0,
                        originalAmount: invoice.coupon.originalAmount,
                        discountAmount: invoice.coupon.discountAmount,
                        finalAmount: invoice.coupon.finalAmount
                    };
                }

                // Agregar factura al historial de pagos del perfil
                profile.paymentHistory.push(new Types.ObjectId(invoice._id as string));

                // Mantener perfil inactivo hasta que se pague la factura de renovación
                profile.isActive = false;

                // NO actualizar las fechas hasta que se pague - mantener plan actual activo
                await profile.save();

            } catch (error) {
                throw new Error('Error al generar factura para la renovación del plan');
            }
        } else {
            // Plan gratuito o usuario admin - renovar inmediatamente
            profile.planAssignment.expiresAt = newExpiresAt;
            profile.planAssignment.variantDays = variantDays;

            // Activar el perfil inmediatamente para admins o planes gratuitos
            profile.isActive = true;

            // Limpiar upgrades expirados y duplicados antes de agregar nuevos
            cleanProfileUpgrades(profile);

            // Generar upgrades incluidos en el plan (sincronizados con la expiración del plan)
            if (plan.includedUpgrades && plan.includedUpgrades.length > 0) {
                const planUpgrades = plan.includedUpgrades.map((code: string) => ({
                    code,
                    startAt: now,
                    endAt: newExpiresAt, // La fecha de fin se sincroniza con la del plan
                    purchaseAt: now,
                    isVisible: true
                }));

                // Fusionar con upgrades existentes (priorizando los nuevos del plan)
                const newCodes = planUpgrades.map((u: any) => u.code);
                const kept = (profile.upgrades || []).filter(u => !newCodes.includes(u.code));
                profile.upgrades = [...kept, ...planUpgrades];

                console.log(`✅ Upgrades sincronizados con el plan en renewPlan: ${plan.includedUpgrades.join(', ')}`);
            }

            await profile.save();
        }

        // Generar mensaje de WhatsApp para renovación
        const whatsAppMessage = await generateWhatsAppMessage(
            profile.user.toString(),
            profileId,
            planCode,
            variantDays,
            invoiceId,
            invoiceNumber,
            true, // isRenewal = true
            variant.price,
            newExpiresAt,
            invoiceCouponInfo
        );

        return {
            profileId,
            planCode,
            variantDays,
            previousExpiresAt: currentExpiresAt,
            newExpiresAt,
            renewedAt: now,
            price: variant.price,
            invoiceId,
            whatsAppMessage
        };
    }
}

export const plansService = new PlansService();