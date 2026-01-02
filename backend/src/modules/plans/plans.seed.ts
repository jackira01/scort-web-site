import mongoose from 'mongoose';
import { PlanDefinitionModel } from './plan.model';
import { UpgradeDefinitionModel } from './upgrade.model';

// Datos de los planes según la especificación
const PLANS_DATA = [
    {
        code: 'DIAMANTE',
        name: 'Plan Diamante',
        level: 1,
        variants: [
            { days: 7, price: 50000, durationRank: 1 },
            { days: 15, price: 95000, durationRank: 2 },
            { days: 30, price: 180000, durationRank: 3 },
            { days: 180, price: 900000, durationRank: 4 }
        ],
        features: {
            showInHome: true,
            showInFilters: true,
            showInSponsored: true
        },
        contentLimits: {
            photos: { min: 10, max: 50 },
            videos: { min: 5, max: 20 },
            storiesPerDayMax: 10
        },
        includedUpgrades: ['DESTACADO'],
        active: true
    },
    {
        code: 'ORO',
        name: 'Plan Oro',
        level: 2,
        variants: [
            { days: 7, price: 35000, durationRank: 1 },
            { days: 15, price: 65000, durationRank: 2 },
            { days: 30, price: 120000, durationRank: 3 },
            { days: 180, price: 600000, durationRank: 4 }
        ],
        features: {
            showInHome: true,
            showInFilters: true,
            showInSponsored: false
        },
        contentLimits: {
            photos: { min: 8, max: 40 },
            videos: { min: 3, max: 15 },
            storiesPerDayMax: 8
        },
        includedUpgrades: [],
        active: true
    },
    {
        code: 'ESMERALDA',
        name: 'Plan Esmeralda',
        level: 3,
        variants: [
            { days: 7, price: 25000, durationRank: 1 },
            { days: 15, price: 45000, durationRank: 2 },
            { days: 30, price: 85000, durationRank: 3 },
            { days: 180, price: 425000, durationRank: 4 }
        ],
        features: {
            showInHome: true,
            showInFilters: true,
            showInSponsored: false
        },
        contentLimits: {
            photos: { min: 6, max: 30 },
            videos: { min: 2, max: 10 },
            storiesPerDayMax: 6
        },
        includedUpgrades: [],
        active: true
    },
    {
        code: 'ZAFIRO',
        name: 'Plan Zafiro',
        level: 4,
        variants: [
            { days: 7, price: 18000, durationRank: 1 },
            { days: 15, price: 32000, durationRank: 2 },
            { days: 30, price: 60000, durationRank: 3 },
            { days: 180, price: 300000, durationRank: 4 }
        ],
        features: {
            showInHome: false,
            showInFilters: true,
            showInSponsored: false
        },
        contentLimits: {
            photos: { min: 4, max: 20 },
            videos: { min: 1, max: 8 },
            storiesPerDayMax: 4
        },
        includedUpgrades: [],
        active: true
    },
    {
        code: 'AMATISTA',
        name: 'Plan Amatista',
        level: 5,
        variants: [
            { days: 7, price: 12000, durationRank: 1 },
            { days: 15, price: 22000, durationRank: 2 },
            { days: 30, price: 40000, durationRank: 3 },
            { days: 180, price: 200000, durationRank: 4 }
        ],
        features: {
            showInHome: false,
            showInFilters: true,
            showInSponsored: false
        },
        contentLimits: {
            photos: { min: 3, max: 15 },
            videos: { min: 1, max: 5 },
            storiesPerDayMax: 3
        },
        includedUpgrades: [],
        active: true
    }
];

// Datos de los upgrades según la especificación
const UPGRADES_DATA = [
    {
        code: 'DESTACADO',
        name: 'Upgrade Destacado',
        price: 15000,
        durationHours: 1, // 1 hora
        requires: [],
        stackingPolicy: 'extend' as const,
        effect: {
            levelDelta: -1,
            priorityBonus: 150,
            positionRule: 'BY_SCORE' as const
        },
        active: true
    },
    {
        code: 'IMPULSO',
        name: 'Upgrade Impulso',
        price: 25000,
        durationHours: 1, // 1 hora
        requires: ['DESTACADO'],
        stackingPolicy: 'replace' as const,
        effect: {
            setLevelTo: 1,
            priorityBonus: 10,
            positionRule: 'BACK' as const
        },
        active: true
    }
];

/**
 * Función para ejecutar el seed de planes
 */
export async function seedPlans(): Promise<void> {
    try {
        for (const planData of PLANS_DATA) {
            const existingPlan = await PlanDefinitionModel.findByCode(planData.code);

            if (!existingPlan) {
                const plan = new PlanDefinitionModel(planData);
                await plan.save();
            } else {
                // Update existing plan
                Object.assign(existingPlan, planData);
                await existingPlan.save();
                console.log(`🔄 Plan ${planData.code} actualizado`);
            }
        }
    } catch (error) {
        console.error('❌ Error en seed de planes:', error);
        throw error;
    }
}

/**
 * Función para ejecutar el seed de upgrades
 */
export async function seedUpgrades(): Promise<void> {
    try {
        for (const upgradeData of UPGRADES_DATA) {
            const existingUpgrade = await UpgradeDefinitionModel.findByCode(upgradeData.code);

            if (!existingUpgrade) {
                const upgrade = new UpgradeDefinitionModel(upgradeData);
                await upgrade.save();
            }
        }

    } catch (error) {
        console.error('❌ Error en seed de upgrades:', error);
        throw error;
    }
}

/**
 * Función principal para ejecutar todo el seed
 */
export async function seedPlansAndUpgrades(): Promise<void> {
    try {

        // Verificar que estamos conectados a la base de datos
        if (mongoose.connection.readyState !== 1) {
            throw new Error('No hay conexión activa a MongoDB');
        }

        // Ejecutar seeds
        await seedPlans();
        await seedUpgrades();

        // Mostrar resumen
        const totalPlans = await PlanDefinitionModel.countDocuments({ active: true });
        const totalUpgrades = await UpgradeDefinitionModel.countDocuments({ active: true });

    } catch (error) {
        console.error('❌ Error en seed completo:', error);
        throw error;
    }
}

/**
 * Función para limpiar todos los datos (útil para testing)
 */
export async function clearPlansAndUpgrades(): Promise<void> {
    try {

        await PlanDefinitionModel.deleteMany({});
        await UpgradeDefinitionModel.deleteMany({});

    } catch (error) {
        console.error('❌ Error al limpiar datos:', error);
        throw error;
    }
}

// Si el archivo se ejecuta directamente
if (require.main === module) {
    const mongoose = require('mongoose');
    const dotenv = require('dotenv');

    dotenv.config();

    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/scort-web-site';

    mongoose.connect(MONGO_URI)
        .then(() => {
            console.log('📦 Conectado a MongoDB');
            return seedPlansAndUpgrades();
        })
        .then(() => {
            console.log('✅ Seed ejecutado exitosamente');
            process.exit(0);
        })
        .catch((error: any) => {
            console.error('❌ Error:', error);
            process.exit(1);
        });
}