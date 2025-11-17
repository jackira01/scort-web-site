import { PlanDefinitionModel, IPlanDefinition, PlanVariant, PlanFeatures, ContentLimits } from './plan.model';
import { UpgradeDefinitionModel, IUpgradeDefinition, StackingPolicy, UpgradeEffect } from './upgrade.model';
import { ProfileModel } from '../profile/profile.model';
import { ConfigParameterService } from '../config-parameter/config-parameter.service';
import InvoiceService from '../payments/invoice.service';
import { Types } from 'mongoose';

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
        const [companyName, companyWhatsApp] = await Promise.all([
            ConfigParameterService.getValue('company.name'),
            ConfigParameterService.getValue('company.whatsapp.number')
        ]);

        if (!companyName || !companyWhatsApp) {
            // Configuración de empresa incompleta para WhatsApp
            return null;
        }

        // Agregar información de descuento si existe
        let discountInfo = '';
        if (couponInfo && couponInfo.originalAmount !== undefined && couponInfo.discountAmount !== undefined && couponInfo.finalAmount !== undefined) {
            discountInfo = `\n\n**Detalle de Descuento:**\n• Cupón: ${couponInfo.code} - ${couponInfo.name}\n• Precio Original: $${couponInfo.originalAmount.toFixed(2)}\n• Descuento Aplicado: -$${couponInfo.discountAmount.toFixed(2)}\n• Total a Pagar: $${couponInfo.finalAmount.toFixed(2)}`;
        }

        let message: string;
        if (isRenewal) {
            // Mensaje específico para renovaciones
            if (invoiceId) {
                const planInfo = planCode && variantDays
                    ? `\n• Plan: ${planCode} (${variantDays} días)`
                    : '';

                const totalPrice = (price || 0) * (variantDays || 1);
                const expirationDate = expiresAt ? new Date(expiresAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }) : 'No disponible';

                message = `¡Hola! 👋\n\n🔄 **Quiero renovar mi plan** 🔄\n\nTu solicitud de renovación ha sido procesada exitosamente. ✅\n\n📋 **Detalles:**${invoiceNumber ? `\n• Número de Factura: ${invoiceNumber}` : ''}\n• ID de Factura: ${invoiceId}\n• Perfil: ${profileId}${planInfo}\n• Total a pagar: $${(price || 0).toLocaleString()} x${variantDays || 0}\n\n💰 **"Total a pagar: $${totalPrice.toLocaleString()}"**\n\n📅 **"Vence el:"** ${expirationDate} 📅${discountInfo}\n\nPor favor, confirma el pago para activar tu perfil. ¡Gracias! 💎`;
            } else {
                const planInfo = planCode && variantDays
                    ? `\n• Plan: ${planCode} (${variantDays} días)`
                    : '';

                message = `¡Hola! 👋\n\n🔄 **Quiero renovar mi plan** 🔄\n\nTu plan gratuito ha sido renovado exitosamente. ✅\n\n📋 **Detalles:**\n• Perfil: ${profileId}${planInfo}\n\n¡Bienvenido de nuevo a ${companyName}! 🎉\n\nSi tienes alguna pregunta, no dudes en contactarnos.`;
            }
        } else {
            // Mensaje para compras normales
            if (invoiceId) {
                const planInfo = planCode && variantDays
                    ? `\n• Plan: ${planCode} (${variantDays} días)`
                    : '';

                message = `¡Hola! 👋\n\nTu compra ha sido procesada exitosamente. ✅\n\n📋 **Detalles:**${invoiceNumber ? `\n• Número de Factura: ${invoiceNumber}` : ''}\n• ID de Factura: ${invoiceId}\n• Perfil: ${profileId}${planInfo}${discountInfo}\n\n¡Gracias por confiar en ${companyName}! 🙏\n\nSi tienes alguna pregunta, no dudes en contactarnos.`;
            } else {
                const planInfo = planCode && variantDays
                    ? `\n• Plan: ${planCode} (${variantDays} días)`
                    : '';

                message = `¡Hola! 👋\n\nTu plan gratuito ha sido activado exitosamente. ✅\n\n📋 **Detalles:**\n• Perfil: ${profileId}${planInfo}\n\n¡Bienvenido a ${companyName}! 🎉\n\nSi tienes alguna pregunta, no dudes en contactarnos.`;
            }
        }

        return {
            userId,
            profileId,
            company: companyName,
            companyNumber: companyWhatsApp,
            message
        };
    } catch (error) {
        // Error generando mensaje de WhatsApp
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

            // Agregar automáticamente los upgrades incluidos en el plan
            if (plan.includedUpgrades && plan.includedUpgrades.length > 0) {
                for (const upgradeCode of plan.includedUpgrades) {
                    // Verificar si el upgrade ya existe y está activo
                    const existingUpgrade = profile.upgrades.find(
                        upgrade => upgrade.code === upgradeCode && upgrade.endAt > now
                    );

                    if (!existingUpgrade) {
                        // Agregar el upgrade incluido en el plan
                        const newUpgrade = {
                            code: upgradeCode,
                            startAt: now,
                            endAt: expiresAt, // Los upgrades del plan duran lo mismo que el plan
                            purchaseAt: now
                        };

                        profile.upgrades.push(newUpgrade);
                    }
                }
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
        const baseDate = currentExpiresAt > now ? currentExpiresAt : now;
        const newExpiresAt = new Date(baseDate);
        newExpiresAt.setDate(newExpiresAt.getDate() + variantDays);

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

            // Agregar automáticamente los upgrades incluidos en el plan
            if (plan.includedUpgrades && plan.includedUpgrades.length > 0) {
                for (const upgradeCode of plan.includedUpgrades) {
                    // Verificar si el upgrade ya existe y está activo
                    const existingUpgrade = profile.upgrades.find(
                        upgrade => upgrade.code === upgradeCode && upgrade.endAt > newExpiresAt
                    );

                    if (!existingUpgrade) {
                        // Agregar el upgrade incluido en el plan
                        const newUpgrade = {
                            code: upgradeCode,
                            startAt: now,
                            endAt: newExpiresAt, // Los upgrades del plan duran lo mismo que el plan
                            purchaseAt: now
                        };

                        profile.upgrades.push(newUpgrade);
                    }
                }
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