"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAgencyLimitsConfig = createAgencyLimitsConfig;
const db_1 = require("../config/db");
const config_parameter_model_1 = require("../modules/config-parameter/config-parameter.model");
const agencyLimitsConfig = [
    {
        key: 'profiles.limits.agency.free_profiles_max',
        value: '10',
        description: 'Número máximo de perfiles gratuitos para agencias',
        category: 'profiles',
        dataType: 'number',
        isPublic: false,
        tags: ['agency', 'limits', 'profiles']
    },
    {
        key: 'profiles.limits.agency.paid_profiles_max',
        value: '50',
        description: 'Número máximo de perfiles de pago para agencias',
        category: 'profiles',
        dataType: 'number',
        isPublic: false,
        tags: ['agency', 'limits', 'profiles']
    },
    {
        key: 'profiles.limits.agency.total_visible_max',
        value: '25',
        description: 'Número máximo de perfiles visibles simultáneamente para agencias',
        category: 'profiles',
        dataType: 'number',
        isPublic: false,
        tags: ['agency', 'limits', 'profiles']
    },
    {
        key: 'profiles.limits.agency.independent_verification_required',
        value: 'true',
        description: 'Si las agencias requieren verificación independiente para sus perfiles',
        category: 'profiles',
        dataType: 'boolean',
        isPublic: false,
        tags: ['agency', 'verification', 'profiles']
    }
];
async function createAgencyLimitsConfig() {
    try {
        console.log('🚀 Iniciando creación de configuración de límites para agencias...');
        await (0, db_1.connectDB)();
        console.log('✅ Conexión a la base de datos establecida');
        for (const config of agencyLimitsConfig) {
            const existingParam = await config_parameter_model_1.ConfigParameterModel.findOne({
                key: config.key
            });
            if (existingParam) {
                console.log(`⚠️  El parámetro ${config.key} ya existe, actualizando...`);
                await config_parameter_model_1.ConfigParameterModel.updateOne({ key: config.key }, {
                    value: config.value,
                    description: config.description,
                    category: config.category,
                    dataType: config.dataType,
                    isPublic: config.isPublic,
                    tags: config.tags,
                    updatedAt: new Date()
                });
                console.log(`✅ Parámetro ${config.key} actualizado`);
            }
            else {
                const newParam = new config_parameter_model_1.ConfigParameterModel({
                    key: config.key,
                    value: config.value,
                    description: config.description,
                    category: config.category,
                    dataType: config.dataType,
                    isPublic: config.isPublic,
                    tags: config.tags,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                await newParam.save();
                console.log(`✅ Parámetro ${config.key} creado`);
            }
        }
        console.log('🎉 Configuración de límites para agencias creada exitosamente');
        console.log('\n📋 Parámetros configurados:');
        agencyLimitsConfig.forEach(config => {
            console.log(`   • ${config.key}: ${config.value}`);
        });
    }
    catch (error) {
        console.error('❌ Error al crear la configuración de límites para agencias:', error);
        throw error;
    }
    finally {
        console.log('🔌 Script finalizado');
    }
}
if (require.main === module) {
    createAgencyLimitsConfig()
        .then(() => {
        console.log('✨ Script ejecutado exitosamente');
        process.exit(0);
    })
        .catch((error) => {
        console.error('💥 Error en la ejecución del script:', error);
        process.exit(1);
    });
}
