import mongoose from 'mongoose';
import { ConfigParameterModel } from '../src/modules/config-parameter/config-parameter.model';
import { Types } from 'mongoose';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configuración de conexión a MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/scort-web-site';

async function createProfileLimitsConfig() {
    try {
        // Conectar a MongoDB
        await mongoose.connect(MONGO_URI);
        console.log('✅ Conectado a MongoDB');

        // Crear un usuario admin temporal para el script (en producción debería ser un usuario real)
        const adminUserId = new Types.ObjectId();

        // Configuraciones a crear
        const configs = [
            {
                key: 'profiles.limits.free_profiles_max',
                name: 'Máximo de Perfiles Gratuitos',
                type: 'number',
                category: 'profiles',
                value: 3,
                metadata: {
                    description: 'Número máximo de perfiles gratuitos (AMATISTA) que puede tener un usuario',
                    ui_config: {
                        component: 'NumberInput',
                        editable: true,
                        custom_props: {
                            min: 1,
                            max: 10,
                            step: 1
                        }
                    },
                    cache_ttl: 300, // 5 minutos
                    requires_restart: false,
                    environment: 'all'
                },
                tags: ['profiles', 'limits', 'free', 'amatista'],
                dependencies: [],
                modifiedBy: adminUserId,
                isActive: true
            },
            {
                key: 'profiles.limits.paid_profiles_max',
                name: 'Máximo de Perfiles de Pago',
                type: 'number',
                category: 'profiles',
                value: 10,
                metadata: {
                    description: 'Número máximo de perfiles con planes de pago que puede tener un usuario',
                    ui_config: {
                        component: 'NumberInput',
                        editable: true,
                        custom_props: {
                            min: 1,
                            max: 50,
                            step: 1
                        }
                    },
                    cache_ttl: 300, // 5 minutos
                    requires_restart: false,
                    environment: 'all'
                },
                tags: ['profiles', 'limits', 'paid', 'premium'],
                dependencies: [],
                modifiedBy: adminUserId,
                isActive: true
            },
            {
                key: 'profiles.limits.total_visible_max',
                name: 'Máximo Total de Perfiles Visibles',
                type: 'number',
                category: 'profiles',
                value: 13,
                metadata: {
                    description: 'Número máximo total de perfiles visibles que puede tener un usuario (gratuitos + pagos)',
                    ui_config: {
                        component: 'NumberInput',
                        editable: true,
                        custom_props: {
                            min: 1,
                            max: 100,
                            step: 1
                        }
                    },
                    cache_ttl: 300, // 5 minutos
                    requires_restart: false,
                    environment: 'all'
                },
                tags: ['profiles', 'limits', 'total', 'visible'],
                dependencies: ['profiles.limits.free_profiles_max', 'profiles.limits.paid_profiles_max'],
                modifiedBy: adminUserId,
                isActive: true
            }
        ];

        // Crear cada configuración
        for (const config of configs) {
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

        console.log('\n🎉 Todas las configuraciones de límites de perfiles han sido procesadas');

    } catch (error) {
        console.error('❌ Error al crear las configuraciones de límites de perfiles:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado de MongoDB');
    }
}

// Ejecutar el script
if (require.main === module) {
    createProfileLimitsConfig();
}

export { createProfileLimitsConfig };