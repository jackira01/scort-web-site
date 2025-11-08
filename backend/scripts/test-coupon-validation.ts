/**
 * Script de prueba para validar el funcionamiento de cupones
 * Ejecutar con: npx ts-node backend/scripts/test-coupon-validation.ts
 */

import mongoose from 'mongoose';
import { CouponModel } from '../src/modules/coupons/coupon.model';
import { PlanDefinitionModel } from '../src/modules/plans/plan.model';
import { isCouponValidForPlan } from '../src/utils/coupon-validation';
import dotenv from 'dotenv';

dotenv.config();

async function connectDB() {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/scort';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB\n');
}

interface TestCase {
    description: string;
    planCode: string;
    variantDays?: number;
    upgradeId?: string;
    expectedResult: boolean;
}

async function testCouponValidation() {
    console.log('🧪 PRUEBAS DE VALIDACIÓN DE CUPONES\n');
    console.log('='.repeat(70));

    // Buscar un cupón de prueba
    const testCoupon = await CouponModel.findOne({
        type: { $in: ['percentage', 'fixed_amount'] },
        isActive: true
    });

    if (!testCoupon) {
        console.log('❌ No se encontraron cupones de prueba');
        console.log('💡 Crea un cupón primero en /adminboard/coupons/create');
        return;
    }

    console.log(`\n📋 Probando cupón: ${testCoupon.code}`);
    console.log(`   Tipo: ${testCoupon.type}`);
    console.log(`   Valor: ${testCoupon.value}`);
    console.log(`   Planes válidos: ${testCoupon.validPlanCodes?.join(', ') || 'N/A'}`);
    console.log(`   Variantes válidas: ${testCoupon.validVariantDays?.join(', ') || 'N/A'}`);
    console.log(`   Upgrades válidos: ${testCoupon.validUpgradeIds?.join(', ') || 'N/A'}`);

    // Obtener planes disponibles
    const plans = await PlanDefinitionModel.find({ active: true });

    if (plans.length === 0) {
        console.log('\n❌ No se encontraron planes activos');
        return;
    }

    console.log('\n🎯 CASOS DE PRUEBA:\n');

    let testsPassed = 0;
    let testsFailed = 0;

    // Generar casos de prueba dinámicamente
    const testCases: TestCase[] = [];

    // Test 1: Planes y variantes válidas
    if (testCoupon.validPlanCodes && testCoupon.validVariantDays) {
        testCoupon.validPlanCodes.forEach(planCode => {
            testCoupon.validVariantDays?.forEach(days => {
                testCases.push({
                    description: `Plan ${planCode} con variante ${days} días (DEBE SER VÁLIDO)`,
                    planCode,
                    variantDays: days,
                    expectedResult: true
                });
            });

            // Probar con variante no válida
            const invalidDays = 999;
            testCases.push({
                description: `Plan ${planCode} con variante ${invalidDays} días (DEBE SER INVÁLIDO)`,
                planCode,
                variantDays: invalidDays,
                expectedResult: false
            });
        });
    }

    // Test 2: Plan no válido
    const invalidPlan = plans.find(p => !testCoupon.validPlanCodes?.includes(p.code));
    if (invalidPlan && testCoupon.validVariantDays?.[0]) {
        testCases.push({
            description: `Plan ${invalidPlan.code} (NO EN LA LISTA) con variante válida (DEBE SER INVÁLIDO)`,
            planCode: invalidPlan.code,
            variantDays: testCoupon.validVariantDays[0],
            expectedResult: false
        });
    }

    // Test 3: Upgrades válidos
    if (testCoupon.validUpgradeIds && testCoupon.validUpgradeIds.length > 0) {
        const validPlan = testCoupon.validPlanCodes?.[0] || 'PREMIUM';
        testCases.push({
            description: `Upgrade ${testCoupon.validUpgradeIds[0]} (DEBE SER VÁLIDO)`,
            planCode: validPlan,
            upgradeId: testCoupon.validUpgradeIds[0],
            expectedResult: true
        });

        testCases.push({
            description: `Upgrade INVALID_UPGRADE (DEBE SER INVÁLIDO)`,
            planCode: validPlan,
            upgradeId: 'INVALID_UPGRADE',
            expectedResult: false
        });
    }

    // Ejecutar casos de prueba
    for (const testCase of testCases) {
        const result = isCouponValidForPlan(
            testCoupon,
            testCase.planCode,
            testCase.variantDays,
            testCase.upgradeId
        );

        const passed = result === testCase.expectedResult;

        if (passed) {
            testsPassed++;
            console.log(`✅ PASS: ${testCase.description}`);
            console.log(`   Resultado: ${result} (esperado: ${testCase.expectedResult})`);
        } else {
            testsFailed++;
            console.log(`❌ FAIL: ${testCase.description}`);
            console.log(`   Resultado: ${result} (esperado: ${testCase.expectedResult})`);
            console.log(`   Parámetros: planCode=${testCase.planCode}, variantDays=${testCase.variantDays}, upgradeId=${testCase.upgradeId}`);
        }
        console.log('');
    }

    // Resumen
    console.log('='.repeat(70));
    console.log('\n📊 RESUMEN DE PRUEBAS:');
    console.log(`   ✅ Pruebas exitosas: ${testsPassed}`);
    console.log(`   ❌ Pruebas fallidas: ${testsFailed}`);
    console.log(`   📈 Total: ${testCases.length}`);

    const successRate = testCases.length > 0
        ? ((testsPassed / testCases.length) * 100).toFixed(1)
        : 0;
    console.log(`   🎯 Tasa de éxito: ${successRate}%`);

    if (testsFailed === 0) {
        console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON!');
    } else {
        console.log('\n⚠️  Algunas pruebas fallaron. Revisar la implementación.');
    }
}

async function testCouponFormats() {
    console.log('\n\n🔍 VERIFICACIÓN DE FORMATOS DE CUPONES\n');
    console.log('='.repeat(70));

    // Cupones con nuevo formato
    const newFormatCoupons = await CouponModel.find({
        type: { $in: ['percentage', 'fixed_amount'] },
        validPlanCodes: { $exists: true, $ne: [] }
    }).limit(5);

    console.log(`\n✨ Cupones con NUEVO formato (${newFormatCoupons.length}):`);
    newFormatCoupons.forEach(coupon => {
        console.log(`\n   📋 ${coupon.code}`);
        console.log(`      - Planes: ${coupon.validPlanCodes?.join(', ')}`);
        console.log(`      - Variantes: ${coupon.validVariantDays?.join(', ')} días`);
    });

    // Cupones con formato antiguo
    const oldFormatCoupons = await CouponModel.find({
        type: { $in: ['percentage', 'fixed_amount'] },
        validPlanIds: { $exists: true, $ne: [] },
        validPlanCodes: { $exists: false }
    }).limit(5);

    console.log(`\n\n⚠️  Cupones con FORMATO ANTIGUO (${oldFormatCoupons.length}):`);
    if (oldFormatCoupons.length > 0) {
        console.log('   💡 Estos cupones necesitan migración');
        oldFormatCoupons.forEach(coupon => {
            console.log(`\n   📋 ${coupon.code}`);
            console.log(`      - validPlanIds: ${coupon.validPlanIds?.join(', ')}`);
        });
        console.log('\n   🔧 Ejecuta: npx ts-node backend/scripts/migrate-coupons-to-new-format.ts');
    } else {
        console.log('   ✅ No hay cupones pendientes de migración');
    }

    // Estadísticas
    const totalPercentage = await CouponModel.countDocuments({ type: 'percentage' });
    const totalFixedAmount = await CouponModel.countDocuments({ type: 'fixed_amount' });
    const totalPlanAssignment = await CouponModel.countDocuments({ type: 'plan_assignment' });

    console.log('\n\n📊 ESTADÍSTICAS GENERALES:');
    console.log(`   - Cupones porcentuales: ${totalPercentage}`);
    console.log(`   - Cupones monto fijo: ${totalFixedAmount}`);
    console.log(`   - Cupones asignación de plan: ${totalPlanAssignment}`);
    console.log(`   - Total: ${totalPercentage + totalFixedAmount + totalPlanAssignment}`);
}

async function main() {
    try {
        console.log('🚀 Iniciando pruebas de validación de cupones\n');

        await connectDB();

        await testCouponValidation();
        await testCouponFormats();

        console.log('\n✅ Pruebas completadas\n');

    } catch (error) {
        console.error('\n❌ Error en las pruebas:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Desconectado de MongoDB');
    }
}

if (require.main === module) {
    main();
}

export { testCouponValidation, testCouponFormats };
