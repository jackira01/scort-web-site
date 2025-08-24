import mongoose from 'mongoose';
import { ConfigParameterModel } from '../src/modules/config-parameter/config-parameter.model';
import { Types } from 'mongoose';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configuración de conexión a MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/scort-web-site';

async function createDefaultPlanConfig() {
    try {
        // Conectar a MongoDB
        await mongoose.connect(MONGO_URI);
        console.log('✅ Conectado a MongoDB');

        // Crear un usuario admin temporal para el script (en producción debería ser un usuario real)
        const adminUserId = new Types.ObjectId();

        // Verificar si ya existe la configuración
        const existingConfig = await ConfigParameterModel.findOne({ key: 'system.default_plan' });
        
        if (existingConfig) {
            console.log('⚠️  La configuración del plan por defecto ya existe');
            console.log('Configuración actual:', existingConfig.value);
            return;
        }

        // Crear la configuración del plan por defecto
        const defaultPlanConfig = new ConfigParameterModel({
            key: 'system.default_plan',
            name: 'Plan por Defecto',
            type: 'object',
            category: 'system',
            value: {
                enabled: false,
                planId: null,
                planCode: null
            },
            metadata: {
                description: 'Configuración del plan por defecto que se asigna automáticamente a los nuevos perfiles',
                ui_config: {
                    component: 'DefaultPlanSelector',
                    editable: true,
                    custom_props: {
                        showToggle: true,
                        showPlanSelector: true
                    }
                },
                cache_ttl: 300, // 5 minutos
                requires_restart: false,
                environment: 'all'
            },
            tags: ['system', 'plans', 'profiles', 'default'],
            dependencies: [],
            modifiedBy: adminUserId,
            isActive: true
        });

        await defaultPlanConfig.save();
        console.log('✅ Configuración del plan por defecto creada exitosamente');
        console.log('Key:', defaultPlanConfig.key);
        console.log('Value:', defaultPlanConfig.value);

    } catch (error) {
        console.error('❌ Error al crear la configuración del plan por defecto:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado de MongoDB');
    }
}

// Ejecutar el script
if (require.main === module) {
    createDefaultPlanConfig();
}

export { createDefaultPlanConfig };