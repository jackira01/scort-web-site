import { PlanDefinitionModel, IPlanDefinition, PlanVariant, PlanFeatures, ContentLimits } from './plan.model';
import { UpgradeDefinitionModel, IUpgradeDefinition, StackingPolicy, UpgradeEffect } from './upgrade.model';
import { ProfileModel } from '../profile/profile.model';
import { Types } from 'mongoose';

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
    
    async validatePlanUpgrades(planCode: string): Promise<{
        valid: boolean;
        invalidUpgrades: string[];
    }> {
        const plan = await PlanDefinitionModel.findByCode(planCode);
        if (!plan) {
            throw new Error(`Plan '${planCode}' no encontrado`);
        }
        
        const invalidUpgrades: string[] = [];
        
        for (const upgradeCode of plan.includedUpgrades) {
            const upgrade = await UpgradeDefinitionModel.findByCode(upgradeCode);
            if (!upgrade || !upgrade.active) {
                invalidUpgrades.push(upgradeCode);
            }
        }
        
        return {
            valid: invalidUpgrades.length === 0,
            invalidUpgrades
        };
    }
    
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

    async purchasePlan(profileId: string, planCode: string, variantDays: number) {
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

        // Asignar el plan al perfil
        profile.planAssignment = {
            planCode: planCode,
            variantDays: variantDays,
            startAt: now,
            expiresAt: expiresAt
        };

        await profile.save();

        return {
            profileId,
            planCode,
            variantDays,
            expiresAt,
            purchaseAt: now,
            price: variant.price
        };
    }

    async renewPlan(profileId: string, extensionDays: number) {
        // Verificar que el perfil existe
        const profile = await ProfileModel.findById(profileId);
        if (!profile) {
            throw new Error('Perfil no encontrado');
        }

        // Verificar que el perfil tiene un plan asignado
        if (!profile.planAssignment) {
            throw new Error('El perfil no tiene un plan activo para renovar');
        }

        const now = new Date();
        
        // Si el plan ya expiró, no se puede renovar
        if (profile.planAssignment.expiresAt <= now) {
            throw new Error('No se puede renovar un plan expirado. Compra un nuevo plan.');
        }

        // Extender la fecha de expiración
        const newExpiresAt = new Date(profile.planAssignment.expiresAt);
        newExpiresAt.setDate(newExpiresAt.getDate() + extensionDays);

        profile.planAssignment.expiresAt = newExpiresAt;
        await profile.save();

        return {
            profileId,
            planCode: profile.planAssignment.planCode,
            extensionDays,
            newExpiresAt,
            renewedAt: now
        };
    }
}

export const plansService = new PlansService();