import { AppDataSource } from '../config/database';
import { ConfigParameter } from '../entities/ConfigParameter';

/**
 * Script para crear los parámetros de configuración específicos para límites de perfiles de agencias
 * Estos parámetros permiten diferenciar los límites entre usuarios comunes y agencias
 */

const agencyLimitsConfig = [
    {
        key: 'profiles.limits.agency.free_profiles_max',
        value: '10',
        description: 'Número máximo de perfiles gratuitos para agencias',
        category: 'profiles',
        dataType: 'number' as const,
        isPublic: false,
        tags: ['agency', 'limits', 'profiles']
    },
    {
        key: 'profiles.limits.agency.paid_profiles_max',
        value: '50',
        description: 'Número máximo de perfiles de pago para agencias',
        category: 'profiles',
        dataType: 'number' as const,
        isPublic: false,
        tags: ['agency', 'limits', 'profiles']
    },
    {
        key: 'profiles.limits.agency.total_visible_max',
        value: '25',
        description: 'Número máximo de perfiles visibles simultáneamente para agencias',
        category: 'profiles',
        dataType: 'number' as const,
        isPublic: false,
        tags: ['agency', 'limits', 'profiles']
    },
    {
        key: 'profiles.limits.agency.independent_verification_required',
        value: 'true',
        description: 'Si las agencias requieren verificación independiente para sus perfiles',
        category: 'profiles',
        dataType: 'boolean' as const,
        isPublic: false,
        tags: ['agency', 'verification', 'profiles']
    }
];

async function createAgencyLimitsConfig() {
    try {
        console.log('🚀 Iniciando creación de configuración de límites para agencias...');
        
        // Inicializar conexión a la base de datos
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
            console.log('✅ Conexión a la base de datos establecida');
        }

        const configRepository = AppDataSource.getRepository(ConfigParameter);

        for (const config of agencyLimitsConfig) {
            // Verificar si el parámetro ya existe
            const existingParam = await configRepository.findOne({
                where: { key: config.key }
            });

            if (existingParam) {
                console.log(`⚠️  El parámetro ${config.key} ya existe, actualizando...`);
                
                // Actualizar parámetro existente
                await configRepository.update(
                    { key: config.key },
                    {
                        value: config.value,
                        description: config.description,
                        category: config.category,
                        dataType: config.dataType,
                        isPublic: config.isPublic,
                        tags: config.tags,
                        updatedAt: new Date()
                    }
                );
                
                console.log(`✅ Parámetro ${config.key} actualizado`);
            } else {
                // Crear nuevo parámetro
                const newParam = configRepository.create({
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

                await configRepository.save(newParam);
                console.log(`✅ Parámetro ${config.key} creado`);
            }
        }

        console.log('🎉 Configuración de límites para agencias creada exitosamente');
        console.log('\n📋 Parámetros configurados:');
        agencyLimitsConfig.forEach(config => {
            console.log(`   • ${config.key}: ${config.value}`);
        });
        
    } catch (error) {
        console.error('❌ Error al crear la configuración de límites para agencias:', error);
        throw error;
    } finally {
        // Cerrar conexión si fue inicializada en este script
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
            console.log('🔌 Conexión a la base de datos cerrada');
        }
    }
}

// Ejecutar el script si se llama directamente
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

export { createAgencyLimitsConfig };