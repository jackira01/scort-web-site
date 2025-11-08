/**
 * Script de migración: Convertir cupones a validPlanVariants
 * Este script migra cupones existentes del formato antiguo (validPlanCodes + validVariantDays)
 * al nuevo formato (validPlanVariants) que evita el producto cartesiano
 * 
 * Ejecutar: npx ts-node backend/scripts/migrate-coupons-to-plan-variants.ts
 */

import mongoose from 'mongoose';
import { CouponModel } from '../src/modules/coupons/coupon.model';
import { PlanDefinitionModel } from '../src/modules/plans/plan.model';
import dotenv from 'dotenv';

dotenv.config();

interface PlanVariantCombination {
    planCode: string;
    variantDays: number;
}

async function connectDB() {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/scort';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB\n');
}

async function migrateCoupons() {
    try {
        console.log('🚀 Iniciando migración de cupones a validPlanVariants\n');
        console.log('='.repeat(70));

        // Buscar cupones que necesitan migración
        const coupons = await CouponModel.find({
            type: { $in: ['percentage', 'fixed_amount'] },
            $or: [
                // Cupones con formato antiguo validPlanIds
                { validPlanIds: { $exists: true, $ne: [] } },
                // Cupones con validPlanCodes + validVariantDays (producto cartesiano)
                {
                    validPlanCodes: { $exists: true, $ne: [] },
                    validVariantDays: { $exists: true, $ne: [] }
                }
            ],
            // Que aún no tienen validPlanVariants
            validPlanVariants: { $exists: false }
        });

        console.log(`\n📊 Encontrados ${coupons.length} cupones para migrar`);

        if (coupons.length === 0) {
            console.log('\n✅ No hay cupones pendientes de migración');
            return;
        }

        console.log('\n' + '='.repeat(70));
        console.log('Iniciando migración...\n');

        let migrated = 0;
        let errors = 0;
        const migrationReport: Array<{
            code: string;
            status: 'success' | 'error';
            combinations?: number;
            error?: string;
        }> = [];

        for (const coupon of coupons) {
            try {
                const validPlanVariants: PlanVariantCombination[] = [];

                console.log(`\n🔄 Procesando cupón: ${coupon.code}`);

                // ESTRATEGIA 1: Migrar desde validPlanIds (formato más antiguo: "planId-days")
                if (coupon.validPlanIds && coupon.validPlanIds.length > 0) {
                    console.log(`   📌 Formato antiguo detectado (validPlanIds): ${coupon.validPlanIds.length} IDs`);

                    for (const validId of coupon.validPlanIds) {
                        // Intentar dividir por guión
                        const parts = validId.split('-');

                        if (parts.length === 2) {
                            const [planId, daysStr] = parts;
                            const plan = await PlanDefinitionModel.findById(planId);

                            if (plan) {
                                const days = parseInt(daysStr);
                                if (!isNaN(days)) {
                                    validPlanVariants.push({
                                        planCode: plan.code,
                                        variantDays: days
                                    });
                                    console.log(`      ✓ ${plan.code} - ${days} días (desde ID)`);
                                }
                            } else {
                                console.log(`      ⚠️ Plan no encontrado para ID: ${planId}`);
                            }
                        } else {
                            // Podría ser solo un código de plan sin días
                            const plan = await PlanDefinitionModel.findOne({
                                $or: [{ _id: validId }, { code: validId.toUpperCase() }]
                            });

                            if (plan && plan.variants) {
                                // Agregar todas las variantes del plan
                                for (const variant of plan.variants) {
                                    validPlanVariants.push({
                                        planCode: plan.code,
                                        variantDays: variant.days
                                    });
                                    console.log(`      ✓ ${plan.code} - ${variant.days} días (todas las variantes)`);
                                }
                            }
                        }
                    }
                }

                // ESTRATEGIA 2: Migrar desde validPlanCodes + validVariantDays (producto cartesiano)
                if (coupon.validPlanCodes && coupon.validPlanCodes.length > 0) {
                    console.log(`   📌 Formato nuevo detectado (producto cartesiano)`);
                    console.log(`      - Planes: ${coupon.validPlanCodes.join(', ')}`);
                    console.log(`      - Variantes: ${coupon.validVariantDays?.join(', ') || 'ninguna'}`);

                    if (coupon.validVariantDays && coupon.validVariantDays.length > 0) {
                        // Crear producto cartesiano de todos los planes × variantes
                        console.log(`      ⚠️ GENERANDO PRODUCTO CARTESIANO (puede crear combinaciones no deseadas)`);

                        for (const planCode of coupon.validPlanCodes) {
                            for (const days of coupon.validVariantDays) {
                                // Verificar que la combinación no esté duplicada
                                const exists = validPlanVariants.some(
                                    pv => pv.planCode === planCode && pv.variantDays === days
                                );

                                if (!exists) {
                                    validPlanVariants.push({ planCode, variantDays: days });
                                    console.log(`      + ${planCode} - ${days} días`);
                                }
                            }
                        }
                    } else {
                        // Si no hay validVariantDays, agregar todas las variantes de cada plan
                        console.log(`      📋 No hay variantes específicas, agregando TODAS las variantes de cada plan`);

                        for (const planCode of coupon.validPlanCodes) {
                            const plan = await PlanDefinitionModel.findOne({ code: planCode });

                            if (plan && plan.variants) {
                                for (const variant of plan.variants) {
                                    const exists = validPlanVariants.some(
                                        pv => pv.planCode === planCode && pv.variantDays === variant.days
                                    );

                                    if (!exists) {
                                        validPlanVariants.push({
                                            planCode: plan.code,
                                            variantDays: variant.days
                                        });
                                        console.log(`      + ${plan.code} - ${variant.days} días`);
                                    }
                                }
                            } else {
                                console.log(`      ⚠️ Plan no encontrado: ${planCode}`);
                            }
                        }
                    }
                }

                // Eliminar duplicados exactos
                const uniqueVariants = Array.from(
                    new Set(validPlanVariants.map(v => `${v.planCode}:${v.variantDays}`))
                ).map(str => {
                    const [planCode, days] = str.split(':');
                    return { planCode, variantDays: parseInt(days) };
                });

                if (uniqueVariants.length > 0) {
                    // Actualizar cupón con el nuevo formato
                    await CouponModel.updateOne(
                        { _id: coupon._id },
                        {
                            $set: { validPlanVariants: uniqueVariants }
                            // NO eliminamos los campos antiguos por retrocompatibilidad
                        }
                    );

                    console.log(`   ✅ Migrado exitosamente: ${uniqueVariants.length} combinaciones`);
                    migrated++;

                    migrationReport.push({
                        code: coupon.code,
                        status: 'success',
                        combinations: uniqueVariants.length
                    });
                } else {
                    console.log(`   ⚠️ No se generaron combinaciones válidas para este cupón`);
                    migrationReport.push({
                        code: coupon.code,
                        status: 'error',
                        error: 'No se generaron combinaciones válidas'
                    });
                    errors++;
                }

            } catch (error) {
                console.error(`   ❌ Error migrando cupón ${coupon.code}:`, error);
                migrationReport.push({
                    code: coupon.code,
                    status: 'error',
                    error: error instanceof Error ? error.message : 'Error desconocido'
                });
                errors++;
            }
        }

        // Reporte final
        console.log('\n' + '='.repeat(70));
        console.log('\n📊 RESUMEN DE MIGRACIÓN:\n');
        console.log(`   ✅ Cupones migrados exitosamente: ${migrated}`);
        console.log(`   ❌ Cupones con errores: ${errors}`);
        console.log(`   📝 Total procesados: ${coupons.length}`);

        if (migrated > 0) {
            console.log('\n✅ Cupones migrados exitosamente:');
            migrationReport
                .filter(r => r.status === 'success')
                .forEach(r => {
                    console.log(`   - ${r.code}: ${r.combinations} combinaciones`);
                });
        }

        if (errors > 0) {
            console.log('\n❌ Cupones con errores:');
            migrationReport
                .filter(r => r.status === 'error')
                .forEach(r => {
                    console.log(`   - ${r.code}: ${r.error}`);
                });
        }

        console.log('\n' + '='.repeat(70));
        console.log('\n💡 NOTAS IMPORTANTES:');
        console.log('   - Los campos antiguos (validPlanCodes, validVariantDays, validPlanIds) se mantienen');
        console.log('   - El sistema ahora usará validPlanVariants prioritariamente');
        console.log('   - La retrocompatibilidad está garantizada');
        console.log('   - Revisa las combinaciones generadas para confirmar que son correctas');
        console.log('\n⚠️  ADVERTENCIA SOBRE PRODUCTO CARTESIANO:');
        console.log('   - Si un cupón tenía validPlanCodes + validVariantDays,');
        console.log('     se creó el producto cartesiano COMPLETO de todas las combinaciones');
        console.log('   - Verifica que las combinaciones generadas sean las correctas');
        console.log('   - Puedes editar manualmente si es necesario\n');

    } catch (error) {
        console.error('\n❌ Error en la migración:', error);
        throw error;
    }
}

async function main() {
    try {
        await connectDB();
        await migrateCoupons();
        console.log('\n✅ Migración completada\n');
    } catch (error) {
        console.error('\n❌ Error fatal:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Desconectado de MongoDB\n');
    }
}

if (require.main === module) {
    main();
}

export { migrateCoupons };
