/**
 * Script para normalizar emails existentes en la base de datos
 * Convierte todos los emails a minúsculas y elimina espacios en blanco
 * 
 * Uso:
 * ts-node backend/scripts/normalize-existing-emails.ts
 */

import mongoose from 'mongoose';
import UserModel from '../src/modules/user/User.model';
import { EmailVerification } from '../src/modules/user/email-verification.model';

// Cargar variables de entorno
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/scort-web-site';

async function normalizeEmails() {
    try {
        console.log('🔌 Conectando a MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado a MongoDB\n');

        // Normalizar emails en la colección de usuarios
        console.log('📧 Normalizando emails en colección de usuarios...');
        const users = await UserModel.find({});
        console.log(`   Encontrados ${users.length} usuarios`);

        let usersUpdated = 0;
        const duplicateEmails: string[] = [];

        for (const user of users) {
            const originalEmail = user.email;
            const normalizedEmail = originalEmail.toLowerCase().trim();

            if (originalEmail !== normalizedEmail) {
                // Verificar si ya existe un usuario con el email normalizado
                const existingUser = await UserModel.findOne({
                    email: normalizedEmail,
                    _id: { $ne: user._id }
                });

                if (existingUser) {
                    console.log(`   ⚠️  Email duplicado detectado:`);
                    console.log(`      - Original: "${originalEmail}" (ID: ${user._id})`);
                    console.log(`      - Ya existe: "${normalizedEmail}" (ID: ${existingUser._id})`);
                    duplicateEmails.push(originalEmail);
                    continue;
                }

                // Actualizar el email
                user.email = normalizedEmail;
                await user.save();
                usersUpdated++;
                console.log(`   ✅ Normalizado: "${originalEmail}" → "${normalizedEmail}"`);
            }
        }

        console.log(`\n📊 Resultado en usuarios:`);
        console.log(`   - Emails normalizados: ${usersUpdated}`);
        console.log(`   - Duplicados detectados: ${duplicateEmails.length}`);

        if (duplicateEmails.length > 0) {
            console.log('\n⚠️  ATENCIÓN: Se detectaron emails duplicados.');
            console.log('   Estos usuarios necesitan revisión manual.');
            console.log('   Puedes combinarlos o eliminar los duplicados antes de continuar.');
        }

        // Normalizar emails en la colección de verificaciones de email
        console.log('\n📧 Normalizando emails en colección de verificaciones...');
        const verifications = await EmailVerification.find({});
        console.log(`   Encontradas ${verifications.length} verificaciones`);

        let verificationsUpdated = 0;

        for (const verification of verifications) {
            const originalEmail = verification.email;
            const normalizedEmail = originalEmail.toLowerCase().trim();

            if (originalEmail !== normalizedEmail) {
                verification.email = normalizedEmail;
                await verification.save();
                verificationsUpdated++;
                console.log(`   ✅ Normalizado: "${originalEmail}" → "${normalizedEmail}"`);
            }
        }

        console.log(`\n📊 Resultado en verificaciones:`);
        console.log(`   - Emails normalizados: ${verificationsUpdated}`);

        console.log('\n✅ Migración completada exitosamente');

        if (duplicateEmails.length > 0) {
            console.log('\n⚠️  IMPORTANTE: Revisa y resuelve los emails duplicados antes de desplegar.');
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Error durante la migración:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Conexión a MongoDB cerrada');
    }
}

// Ejecutar la migración
normalizeEmails();
