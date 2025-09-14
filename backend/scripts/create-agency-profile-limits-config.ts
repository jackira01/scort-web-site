import mongoose, { Types } from 'mongoose';
import { ConfigParameterModel } from '../src/modules/config-parameter/config-parameter.model';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/scort-web-site';

/**
 * Script para crear configuraciones de límites de perfiles específicas para agencias
 */
async function createAgencyProfileLimitsConfig() {
    try {
        // Conectar a MongoDB
        await mongoose.connect(MONGO_URI);
        console.log('✅ Conectado a MongoDB');

        // Crear un usuario admin temporal para el script (en producción debería ser un usuario real)
        const adminUserId = new Types.ObjectId();

        // Configuraciones específicas para agencias
        const agencyConfigs = [
            {
                key: 'profiles.limits.agency.free_profiles_max',
                name: 'Máximo de Perfiles Gratuitos para Agencias',
                type: 'number',
                category: 'profiles',
                value: 5,
                metadata: {
                    description: 'Número máximo de perfiles gratuitos (AMATISTA) que puede tener una agencia',
                    ui_config: {
                        component: 'NumberInput',
                        editable: true,
                        custom_props: {
                            min: 1,
                            max: 20,
                            step: 1
                        }
                    },
                    cache_ttl: 300, // 5 minutos
                    requires_restart: false,
                    environment: 'all'
                },
                tags: ['profiles', 'limits', 'free', 'amatista', 'agency'],
                dependencies: [],
                modifiedBy: adminUserId,
                isActive: true
            },
            {
                key: 'profiles.limits.agency.paid_profiles_max',
                name: 'Máximo de Perfiles de Pago para Agencias',
                type: 'number',
                category: 'profiles',
                value: 50,
                metadata: {
                    description: 'Número máximo de perfiles con planes de pago que puede tener una agencia',
                    ui_config: {
                        component: 'NumberInput',
                        editable: true,
                        custom_props: {
                            min: 1,
                            max: 200,
                            step: 1
                        }
                    },
                    cache_ttl: 300, // 5 minutos
                    requires_restart: false,
                    environment: 'all'
                },
                tags: ['profiles', 'limits', 'paid', 'premium', 'agency'],
                dependencies: [],
                modifiedBy: adminUserId,
                isActive: true
            },
            {
                key: 'profiles.limits.agency.total_visible_max',
                name: 'Máximo Total de Perfiles Visibles para Agencias',
                type: 'number',
                category: 'profiles',
                value: 55,
                metadata: {
                    description: 'Número máximo total de perfiles visibles que puede tener una agencia (gratuitos + pagos)',
                    ui_config: {
                        component: 'NumberInput',
                        editable: true,
                        custom_props: {
                            min: 1,
                            max: 300,
                            step: 1
                        }
                    },
                    cache_ttl: 300, // 5 minutos
                    requires_restart: false,
                    environment: 'all'
                },
                tags: ['profiles', 'limits', 'total', 'visible', 'agency'],
                dependencies: ['profiles.limits.agency.free_profiles_max', 'profiles.limits.agency.paid_profiles_max'],
                modifiedBy: adminUserId,
                isActive: true
            },
            {
                key: 'profiles.limits.agency.independent_verification_required',
                name: 'Verificación Independiente Requerida para Agencias',
                type: 'boolean',
                category: 'profiles',
                value: true,
                metadata: {
                    description: 'Si las agencias requieren verificación independiente para perfiles adicionales',
                    ui_config: {
                        component: 'Switch',
                        editable: true,
                        custom_props: {}
                    },
                    cache_ttl: 300, // 5 minutos
                    requires_restart: false,
                    environment: 'all'
                },
                tags: ['profiles', 'verification', 'agency', 'independent'],
                dependencies: [],
                modifiedBy: adminUserId,
                isActive: true
            }
        ];

        // Crear cada configuración
        for (const config of agencyConfigs) {
            // Verificar si ya existe la configuración
            const existingConfig = await ConfigParameterModel.findOne({ key: config.key });
            
            if (existingConfig) {
                console.log(`⚠️  La configuración '${config.key}' ya existe`);
                console.log('Configuración actual:', existingConfig.value);
                continue;
            }

            // Crear la configuración
            const newConfig = new ConfigParameterModel(config);
            await newConfig.save();
            
            console.log(`✅ Configuración '${config.key}' creada exitosamente`);
            console.log('Valor:', config.value);
        }

        console.log('\n🎉 Todas las configuraciones de límites de perfiles para agencias han sido procesadas');

    } catch (error) {
        console.error('❌ Error al crear las configuraciones de límites de perfiles para agencias:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado de MongoDB');
    }
}

// Ejecutar el script
if (require.main === module) {
    createAgencyProfileLimitsConfig();
}

export { createAgencyProfileLimitsConfig };