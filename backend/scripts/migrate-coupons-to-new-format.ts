/**
 * Script de migración de cupones al nuevo formato
 * 
 * Migra cupones existentes que usan validPlanIds (formato: "planId-days" o "planId")
 * al nuevo formato con validPlanCodes y validVariantDays separados
 * 
 * Ejecutar con: npx ts-node backend/scripts/migrate-coupons-to-new-format.ts
 */

import mongoose from 'mongoose';
import { CouponModel } from '../src/modules/coupons/coupon.model';
import { PlanDefinitionModel } from '../src/modules/plans/plan.model';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

interface MigrationResult {
    total: number;
    migrated: number;
    skipped: number;
    errors: number;
    details: Array<{
        code: string;
        status: 'migrated' | 'skipped' | 'error';
        message?: string;
        before?: any;
        after?: any;
    }>;
}

async function connectDB() {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/scort';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');
}

async function migrateCoupons(): Promise<MigrationResult> {
    const result: MigrationResult = {
        total: 0,
        migrated: 0,
        skipped: 0,
        errors: 0,
        details: []
    };

    try {
        // Buscar cupones que tengan validPlanIds con datos
        const coupons = await CouponModel.find({
            type: { $in: ['percentage', 'fixed_amount'] },
            validPlanIds: { $exists: true, $ne: [] }
        });

        result.total = coupons.length;
        console.log(`\n📊 Encontrados ${result.total} cupones para revisar\n`);

        for (const coupon of coupons) {
            try {
                console.log(`🔍 Procesando cupón: ${coupon.code}`);

                // Si ya tiene el nuevo formato, saltar
                if (coupon.validPlanCodes && coupon.validPlanCodes.length > 0) {
                    console.log(`   ⏭️  Ya migrado, saltando...`);
                    result.skipped++;
                    result.details.push({
                        code: coupon.code,
                        status: 'skipped',
                        message: 'Ya tiene validPlanCodes'
                    });
                    continue;
                }

                const planCodes: Set<string> = new Set();
                const variantDays: Set<number> = new Set();
                const invalidIds: string[] = [];

                // Procesar cada validPlanId
                for (const validId of coupon.validPlanIds || []) {
                    // Verificar si el ID tiene el formato incorrecto "planId-days"
                    const parts = validId.split('-');

                    if (parts.length >= 2 && !isNaN(Number(parts[parts.length - 1]))) {
                        // Formato: "planId-days" o "segmento1-segmento2-...-days"
                        const days = parseInt(parts[parts.length - 1]);
                        const planId = parts.slice(0, -1).join('-');

                        // Buscar el plan por ID
                        const plan = await PlanDefinitionModel.findById(planId);

                        if (plan) {
                            console.log(`   ✓ Encontrado plan ${plan.code} con variante ${days} días`);
                            planCodes.add(plan.code);
                            variantDays.add(days);
                        } else {
                            console.log(`   ⚠️  Plan no encontrado para ID: ${planId}`);
                            invalidIds.push(validId);
                        }
                    } else {
                        // Formato: código de plan o ID de plan sin días
                        // Intentar buscar por código primero
                        let plan = await PlanDefinitionModel.findOne({ code: validId.toUpperCase() });

                        // Si no se encuentra por código, intentar por ID
                        if (!plan && mongoose.Types.ObjectId.isValid(validId)) {
                            plan = await PlanDefinitionModel.findById(validId);
                        }

                        if (plan) {
                            console.log(`   ✓ Encontrado plan ${plan.code} (sin variante específica)`);
                            planCodes.add(plan.code);
                            // No agregar días específicos, el cupón será válido para todas las variantes
                        } else {
                            console.log(`   ⚠️  Plan no encontrado: ${validId}`);
                            invalidIds.push(validId);
                        }
                    }
                }

                if (invalidIds.length > 0) {
                    console.log(`   ⚠️  IDs inválidos encontrados: ${invalidIds.join(', ')}`);
                }

                // Si se encontraron códigos de plan, actualizar
                if (planCodes.size > 0) {
                    const beforeData = {
                        validPlanIds: coupon.validPlanIds,
                        validPlanCodes: coupon.validPlanCodes,
                        validVariantDays: coupon.validVariantDays
                    };

                    await CouponModel.updateOne(
                        { _id: coupon._id },
                        {
                            $set: {
                                validPlanCodes: Array.from(planCodes),
                                validVariantDays: Array.from(variantDays)
                                // Mantener validPlanIds para retrocompatibilidad
                            }
                        }
                    );

                    const afterData = {
                        validPlanIds: coupon.validPlanIds, // Se mantiene
                        validPlanCodes: Array.from(planCodes),
                        validVariantDays: Array.from(variantDays)
                    };

                    console.log(`   ✅ Migrado exitosamente`);
                    console.log(`      - Planes: ${Array.from(planCodes).join(', ')}`);
                    console.log(`      - Variantes: ${Array.from(variantDays).join(', ')} días`);

                    result.migrated++;
                    result.details.push({
                        code: coupon.code,
                        status: 'migrated',
                        message: `Migrado: ${planCodes.size} planes, ${variantDays.size} variantes`,
                        before: beforeData,
                        after: afterData
                    });
                } else {
                    console.log(`   ⚠️  No se pudo migrar: no se encontraron planes válidos`);
                    result.skipped++;
                    result.details.push({
                        code: coupon.code,
                        status: 'skipped',
                        message: 'No se encontraron planes válidos'
                    });
                }

            } catch (error) {
                console.error(`   ❌ Error procesando cupón ${coupon.code}:`, error);
                result.errors++;
                result.details.push({
                    code: coupon.code,
                    status: 'error',
                    message: error instanceof Error ? error.message : 'Error desconocido'
                });
            }

            console.log(''); // Línea en blanco entre cupones
        }

        return result;

    } catch (error) {
        console.error('❌ Error en migración:', error);
        throw error;
    }
}

async function main() {
    try {
        console.log('🚀 Iniciando migración de cupones al nuevo formato\n');
        console.log('='.repeat(60));

        await connectDB();

        const result = await migrateCoupons();

        console.log('='.repeat(60));
        console.log('\n📈 RESUMEN DE MIGRACIÓN:');
        console.log(`   Total de cupones revisados: ${result.total}`);
        console.log(`   ✅ Migrados exitosamente: ${result.migrated}`);
        console.log(`   ⏭️  Saltados (ya migrados): ${result.skipped}`);
        console.log(`   ❌ Errores: ${result.errors}`);

        if (result.migrated > 0) {
            console.log('\n✨ Cupones migrados:');
            result.details
                .filter(d => d.status === 'migrated')
                .forEach(detail => {
                    console.log(`   - ${detail.code}: ${detail.message}`);
                });
        }

        if (result.errors > 0) {
            console.log('\n⚠️  Cupones con errores:');
            result.details
                .filter(d => d.status === 'error')
                .forEach(detail => {
                    console.log(`   - ${detail.code}: ${detail.message}`);
                });
        }

        console.log('\n✅ Migración completada');

    } catch (error) {
        console.error('\n❌ Error fatal en migración:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Desconectado de MongoDB');
    }
}

// Ejecutar si es el módulo principal
if (require.main === module) {
    main();
}

export { migrateCoupons };
