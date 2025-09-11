"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedPlans = seedPlans;
exports.seedUpgrades = seedUpgrades;
exports.seedPlansAndUpgrades = seedPlansAndUpgrades;
exports.clearPlansAndUpgrades = clearPlansAndUpgrades;
const mongoose_1 = __importDefault(require("mongoose"));
const plan_model_1 = require("./plan.model");
const upgrade_model_1 = require("./upgrade.model");
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
const UPGRADES_DATA = [
    {
        code: 'DESTACADO',
        name: 'Upgrade Destacado',
        durationHours: 24,
        requires: [],
        stackingPolicy: 'extend',
        effect: {
            levelDelta: -1,
            priorityBonus: 150,
            positionRule: 'BY_SCORE'
        },
        active: true
    },
    {
        code: 'IMPULSO',
        name: 'Upgrade Impulso',
        durationHours: 12,
        requires: ['DESTACADO'],
        stackingPolicy: 'replace',
        effect: {
            setLevelTo: 1,
            priorityBonus: 10,
            positionRule: 'BACK'
        },
        active: true
    }
];
async function seedPlans() {
    try {
        console.log('🌱 Iniciando seed de planes...');
        for (const planData of PLANS_DATA) {
            const existingPlan = await plan_model_1.PlanDefinitionModel.findByCode(planData.code);
            if (!existingPlan) {
                const plan = new plan_model_1.PlanDefinitionModel(planData);
                await plan.save();
                console.log(`✅ Plan ${planData.code} creado exitosamente`);
            }
            else {
                console.log(`⚠️  Plan ${planData.code} ya existe, omitiendo...`);
            }
        }
        console.log('✅ Seed de planes completado');
    }
    catch (error) {
        console.error('❌ Error en seed de planes:', error);
        throw error;
    }
}
async function seedUpgrades() {
    try {
        console.log('🌱 Iniciando seed de upgrades...');
        for (const upgradeData of UPGRADES_DATA) {
            const existingUpgrade = await upgrade_model_1.UpgradeDefinitionModel.findByCode(upgradeData.code);
            if (!existingUpgrade) {
                const upgrade = new upgrade_model_1.UpgradeDefinitionModel(upgradeData);
                await upgrade.save();
                console.log(`✅ Upgrade ${upgradeData.code} creado exitosamente`);
            }
            else {
                console.log(`⚠️  Upgrade ${upgradeData.code} ya existe, omitiendo...`);
            }
        }
        console.log('✅ Seed de upgrades completado');
    }
    catch (error) {
        console.error('❌ Error en seed de upgrades:', error);
        throw error;
    }
}
async function seedPlansAndUpgrades() {
    try {
        console.log('🚀 Iniciando seed completo de planes y upgrades...');
        if (mongoose_1.default.connection.readyState !== 1) {
            throw new Error('No hay conexión activa a MongoDB');
        }
        if (process.env.FEATURE_VISIBILITY_ENGINE !== 'true') {
            console.log('⚠️  FEATURE_VISIBILITY_ENGINE no está habilitado, pero continuando con el seed...');
        }
        await seedPlans();
        await seedUpgrades();
        console.log('🎉 Seed completo ejecutado exitosamente');
        const totalPlans = await plan_model_1.PlanDefinitionModel.countDocuments({ active: true });
        const totalUpgrades = await upgrade_model_1.UpgradeDefinitionModel.countDocuments({ active: true });
        console.log(`📊 Resumen:`);
        console.log(`   - Planes activos: ${totalPlans}`);
        console.log(`   - Upgrades activos: ${totalUpgrades}`);
    }
    catch (error) {
        console.error('❌ Error en seed completo:', error);
        throw error;
    }
}
async function clearPlansAndUpgrades() {
    try {
        console.log('🧹 Limpiando datos de planes y upgrades...');
        await plan_model_1.PlanDefinitionModel.deleteMany({});
        await upgrade_model_1.UpgradeDefinitionModel.deleteMany({});
        console.log('✅ Datos limpiados exitosamente');
    }
    catch (error) {
        console.error('❌ Error al limpiar datos:', error);
        throw error;
    }
}
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
        .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });
}
