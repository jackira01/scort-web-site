"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initBasicConfig = initBasicConfig;
const mongoose_1 = __importDefault(require("mongoose"));
const config_parameter_model_1 = require("../modules/config-parameter/config-parameter.model");
const dotenv_1 = __importDefault(require("dotenv"));
// Cargar variables de entorno
dotenv_1.default.config();
// Configuración básica de la empresa
const BASIC_CONFIG_PARAMS = [
    {
        key: 'company.email',
        value: 'soporte@prepagosvip.com',
        name: 'Email de la Empresa',
        description: 'Email principal de la empresa para envío de correos y soporte',
        category: 'company',
        dataType: 'string',
        isPublic: true,
        tags: ['email', 'company', 'contact'],
        metadata: {
            validation: {
                required: true,
                pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'
            },
            ui_config: {
                input_type: 'email',
                placeholder: 'correo@empresa.com',
                help_text: 'Email principal de la empresa usado para envío de correos'
            }
        }
    },
    {
        key: 'company.name',
        value: 'Prepagos VIP',
        name: 'Nombre de la Empresa',
        description: 'Nombre oficial de la empresa',
        category: 'company',
        dataType: 'string',
        isPublic: true,
        tags: ['company', 'branding'],
        metadata: {
            validation: {
                required: true,
                minLength: 2,
                maxLength: 100
            },
            ui_config: {
                input_type: 'text',
                placeholder: 'Nombre de la Empresa',
                help_text: 'Nombre oficial que aparecerá en correos y comunicaciones'
            }
        }
    },
    {
        key: 'company.phone',
        value: '+57 300 123 4567',
        name: 'Teléfono de la Empresa',
        description: 'Número de teléfono principal de la empresa',
        category: 'company',
        dataType: 'string',
        isPublic: true,
        tags: ['phone', 'company', 'contact'],
        metadata: {
            validation: {
                required: false
            },
            ui_config: {
                input_type: 'tel',
                placeholder: '+57 300 123 4567',
                help_text: 'Número de teléfono principal de contacto'
            }
        }
    },
    {
        key: 'company.address',
        value: 'Bogotá, Colombia',
        name: 'Dirección de la Empresa',
        description: 'Dirección física de la empresa',
        category: 'company',
        dataType: 'string',
        isPublic: true,
        tags: ['address', 'company', 'contact'],
        metadata: {
            validation: {
                required: false
            },
            ui_config: {
                input_type: 'text',
                placeholder: 'Ciudad, País',
                help_text: 'Dirección o ubicación de la empresa'
            }
        }
    }
];
/**
 * Función para inicializar los parámetros básicos de configuración
 */
async function initBasicConfig() {
    try {
        console.log('🌱 Iniciando configuración básica de la empresa...');
        for (const configParam of BASIC_CONFIG_PARAMS) {
            const existingParam = await config_parameter_model_1.ConfigParameterModel.findOne({ key: configParam.key });
            if (!existingParam) {
                const newParam = new config_parameter_model_1.ConfigParameterModel({
                    ...configParam,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                await newParam.save();
                console.log(`✅ Parámetro ${configParam.key} creado exitosamente`);
            }
            else {
                console.log(`⚠️  Parámetro ${configParam.key} ya existe, omitiendo...`);
            }
        }
        console.log('✅ Configuración básica completada');
        // Mostrar resumen
        console.log('\n📋 Parámetros configurados:');
        BASIC_CONFIG_PARAMS.forEach(config => {
            console.log(`   • ${config.key}: ${config.value}`);
        });
    }
    catch (error) {
        console.error('❌ Error al inicializar configuración básica:', error);
        throw error;
    }
}
/**
 * Función principal para ejecutar el script
 */
async function main() {
    try {
        // Verificar que estamos conectados a la base de datos
        if (mongoose_1.default.connection.readyState !== 1) {
            const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/scort-web-site';
            await mongoose_1.default.connect(MONGO_URI);
            console.log('📦 Conectado a MongoDB');
        }
        await initBasicConfig();
        console.log('🎉 Script ejecutado exitosamente');
    }
    catch (error) {
        console.error('❌ Error en el script:', error);
        throw error;
    }
    finally {
        // Cerrar conexión si fue inicializada en este script
        if (mongoose_1.default.connection.readyState === 1) {
            await mongoose_1.default.disconnect();
            console.log('🔌 Conexión a la base de datos cerrada');
        }
    }
}
// Si el archivo se ejecuta directamente
if (require.main === module) {
    main()
        .then(() => {
        console.log('✅ Script completado');
        process.exit(0);
    })
        .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });
}
exports.default = main;
