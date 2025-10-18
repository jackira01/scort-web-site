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
    level: number;
    variants: PlanVariant[];
    features: PlanFeatures;
    contentLimits: ContentLimits;
    includedUpgrades?: string[];
    active?: boolean;
}

export interface UpdatePlanInput {
    name?: string;
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
    requires?: string[];
    stackingPolicy?: StackingPolicy;
    effect: UpgradeEffect;
    active?: boolean;
}

export interface UpdateUpgradeInput {
    name?: string;
    durationHours?: number;
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
    activeOnly?: boolean;
    search?: string;
}

// Función helper para generar mensaje de WhatsApp
const generateWhatsAppMessage = async (
    userId: string,
    profileId: string,
    planCode?: string,
    variantDays?: number,
    invoiceId?: string,
    isRenewal?: boolean,
    price?: number,
    expiresAt?: Date
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
                
                message = `¡Hola! 👋\n\n🔄 **Quiero renovar mi plan** 🔄\n\nTu solicitud de renovación ha sido procesada exitosamente. ✅\n\n📋 **Detalles:**\n• ID de Factura: ${invoiceId}\n• Perfil: ${profileId}${planInfo}\n• Total a pagar: $${(price || 0).toLocaleString()} x${variantDays || 0}\n\n💰 **"Total a pagar: $${totalPrice.toLocaleString()}"**\n\n📅 **"Vence el:"** ${expirationDate} 📅\n\nPor favor, confirma el pago para activar tu perfil. ¡Gracias! 💎`;
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
                
                message = `¡Hola! 👋\n\nTu compra ha sido procesada exitosamente. ✅\n\n📋 **Detalles:**\n• ID de Factura: ${invoiceId}\n• Perfil: ${profileId}${planInfo}\n\n¡Gracias por confiar en ${companyName}! 🙏\n\nSi tienes alguna pregunta, no dudes en contactarnos.`;
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
            activeOnly = true,
            search
        } = options;

        const query: any = {};

        // Filtro por estado activo solo si activeOnly es true
        if (activeOnly) {
            query.active = true;
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
            activeOnly = true
        } = options;

        const query = activeOnly ? { active: true } : {};
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
                        console.log(`🎁 Upgrade incluido agregado: ${upgradeCode}`);
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
            true, // isRenewal = true
            variant.price,
            expiresAt
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
        console.log('🔍 DEBUG BACKEND SERVICE - renewPlan iniciado con parámetros:', {
            profileId,
            planCode,
            variantDays,
            isAdmin
        });

        // Verificar que el perfil existe
        const profile = await ProfileModel.findById(profileId);
        if (!profile) {
            console.log('🔍 DEBUG BACKEND SERVICE - Error: Perfil no encontrado');
            throw new Error('Perfil no encontrado');
        }
        console.log('🔍 DEBUG BACKEND SERVICE - Perfil encontrado:', profile._id);

        // Verificar que el plan existe
        const plan = await PlanDefinitionModel.findOne({ code: planCode, active: true });
        if (!plan) {
            console.log('🔍 DEBUG BACKEND SERVICE - Error: Plan no encontrado o inactivo');
            throw new Error('Plan no encontrado o inactivo');
        }
        console.log('🔍 DEBUG BACKEND SERVICE - Plan encontrado:', plan.code);

        // Verificar que la variante existe
        const variant = plan.variants.find(v => v.days === variantDays);
        if (!variant) {
            console.log('🔍 DEBUG BACKEND SERVICE - Error: Variante no encontrada');
            throw new Error('Variante de plan no encontrada');
        }
        console.log('🔍 DEBUG BACKEND SERVICE - Variante encontrada:', { days: variant.days, price: variant.price });

        // Verificar si el perfil tiene un plan del mismo tipo (activo o expirado)
        if (!profile.planAssignment || profile.planAssignment.planCode !== planCode) {
            console.log('🔍 DEBUG BACKEND SERVICE - Error: El perfil no tiene un plan del tipo especificado');
            throw new Error('El perfil no tiene un plan del tipo especificado para renovar');
        }

        // Extender la fecha de expiración desde la fecha actual de expiración o desde ahora si ya expiró
        const currentExpiresAt = profile.planAssignment.expiresAt;
        const now = new Date();
        const baseDate = currentExpiresAt > now ? currentExpiresAt : now;
        const newExpiresAt = new Date(baseDate);
        newExpiresAt.setDate(newExpiresAt.getDate() + variantDays);

        console.log('🔍 DEBUG BACKEND SERVICE - Fechas calculadas:', {
            currentExpiresAt,
            baseDate,
            newExpiresAt
        });

        // Generar factura si el plan tiene precio y NO es admin
        let invoiceId: string | undefined;
        console.log('🔍 DEBUG BACKEND SERVICE - Evaluando si generar factura:', {
            variantPrice: variant.price,
            isAdmin,
            shouldGenerateInvoice: variant.price > 0 && !isAdmin
        });

        if (variant.price > 0 && !isAdmin) {
            console.log('🔍 DEBUG BACKEND SERVICE - Generando factura (usuario normal con precio > 0)');
            try {
                const invoice = await InvoiceService.generateInvoice({
                    userId: profile.user.toString(),
                    profileId: profileId,
                    planCode: planCode,
                    planDays: variantDays,
                    upgradeCodes: []
                });
                invoiceId = invoice.id;
                console.log('🔍 DEBUG BACKEND SERVICE - Factura generada:', invoiceId);

                // Agregar factura al historial de pagos del perfil
                profile.paymentHistory.push(new Types.ObjectId(invoice._id as string));

                // Mantener perfil inactivo hasta que se pague la factura de renovación
                profile.isActive = false;

                // NO actualizar las fechas hasta que se pague - mantener plan actual activo
                await profile.save();
                console.log('🔍 DEBUG BACKEND SERVICE - Perfil guardado con factura pendiente');

            } catch (error) {
                console.log('🔍 DEBUG BACKEND SERVICE - Error generando factura:', error);
                throw new Error('Error al generar factura para la renovación del plan');
            }
        } else {
            console.log('🔍 DEBUG BACKEND SERVICE - Renovando inmediatamente (admin o plan gratuito)');
            // Plan gratuito o usuario admin - renovar inmediatamente
            profile.planAssignment.expiresAt = newExpiresAt;
            profile.planAssignment.variantDays = variantDays;
            
            // Activar el perfil inmediatamente para admins o planes gratuitos
            profile.isActive = true;
            
            // Agregar automáticamente los upgrades incluidos en el plan
            if (plan.includedUpgrades && plan.includedUpgrades.length > 0) {
                console.log('🔍 DEBUG BACKEND SERVICE - Agregando upgrades incluidos:', plan.includedUpgrades);
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
                        console.log(`🎁 Upgrade incluido agregado en renovación: ${upgradeCode}`);
                    }
                }
            }
            
            await profile.save();
            console.log('🔍 DEBUG BACKEND SERVICE - Perfil renovado y guardado exitosamente');
        }

        // Generar mensaje de WhatsApp para renovación
        const whatsAppMessage = await generateWhatsAppMessage(
            profile.user.toString(),
            profileId,
            planCode,
            variantDays,
            invoiceId,
            true, // isRenewal = true
            variant.price,
            newExpiresAt
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