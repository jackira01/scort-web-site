import mongoose from 'mongoose';
import { ConfigParameterModel } from '../src/modules/config-parameter/config-parameter.model';
import { Types } from 'mongoose';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configuración de conexión a MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/scort-web-site';

async function initCompanyEmailConfig() {
    try {
        // Conectar a MongoDB
        await mongoose.connect(MONGO_URI);
        console.log('✅ Conectado a MongoDB');

        // Crear un usuario admin temporal para el script
        const adminUserId = new Types.ObjectId();

        // Verificar si ya existe la configuración
        const existingConfig = await ConfigParameterModel.findOne({ key: 'company.email' });
        
        if (existingConfig) {
            console.log('⚠️  La configuración company.email ya existe');
            console.log('Email actual:', existingConfig.value);
            return;
        }

        // Obtener el email desde variables de entorno o usar un valor por defecto
        const companyEmail = process.env.SUPPORT_EMAIL || process.env.COMPANY_EMAIL || 'contacto@empresa.com';

        // Crear la configuración del email de la empresa
        const companyEmailConfig = new ConfigParameterModel({
            key: 'company.email',
            name: 'Email de la Empresa',
            type: 'string',
            category: 'company',
            value: companyEmail,
            metadata: {
                description: 'Email principal de la empresa para recibir formularios de contacto y notificaciones',
                ui_config: {
                    component: 'EmailInput',
                    editable: true,
                    custom_props: {
                        placeholder: 'contacto@empresa.com',
                        validation: 'email'
                    }
                },
                cache_ttl: 300, // 5 minutos
                requires_restart: false,
                environment: 'all'
            },
            tags: ['company', 'email', 'contact', 'notifications'],
            dependencies: [],
            modifiedBy: adminUserId,
            isActive: true
        });

        await companyEmailConfig.save();
        console.log('✅ Configuración company.email creada exitosamente');
        console.log('Email configurado:', companyEmail);
        console.log('\n📋 Para cambiar este email:');
        console.log('   1. Accede al panel de administración');
        console.log('   2. Ve a Configuración > Parámetros');
        console.log('   3. Busca "company.email" y actualiza el valor');

    } catch (error) {
        console.error('❌ Error al crear la configuración company.email:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado de MongoDB');
    }
}

// Ejecutar el script
if (require.main === module) {
    initCompanyEmailConfig();
}

export { initCompanyEmailConfig };