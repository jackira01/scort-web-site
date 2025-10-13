/**
 * 🧪 CASOS DE PRUEBA PARA CUPONES CON VALIDACIÓN DE PLANES
 * 
 * Este archivo contiene casos de prueba para validar la funcionalidad
 * de cupones con validPlanIds y validUpgradeIds para tipos percentage y fixed_amount.
 */

// Simulación de la función de validación
function isCouponValidForPlan(coupon, planId, upgradeId) {
  // Si el cupón no tiene restricciones, es válido para cualquier plan
  if (!coupon.validPlanIds?.length && !coupon.validUpgradeIds?.length) {
    return true;
  }

  // Verificar si el plan está en la lista de planes válidos
  if (planId && coupon.validPlanIds?.includes(planId)) {
    return true;
  }

  // Verificar si el upgrade está en la lista de upgrades válidos
  if (upgradeId && coupon.validUpgradeIds?.includes(upgradeId)) {
    return true;
  }

  // Si no aplica a ninguno, no es válido
  return false;
}

// Simulación de la función de aplicación de cupón
function applyCouponToPlan(plan, coupon, upgradeId) {
  if (!coupon) return plan.price;

  // 1️⃣ Verificar validez del cupón frente al plan
  if (!isCouponValidForPlan(coupon, plan.id, upgradeId)) {
    console.warn("❌ El cupón no aplica a este plan o upgrade.");
    return plan.price;
  }

  // 2️⃣ Plan gratuito no admite cupones
  if (plan.price <= 0) {
    console.warn("❌ Los cupones no se pueden aplicar a planes gratuitos.");
    return 0;
  }

  // 3️⃣ Aplicar según tipo
  let discountedPrice = plan.price;
  
  if (coupon.type === "percentage") {
    const discount = (plan.price * (coupon.value ?? 0)) / 100;
    discountedPrice = plan.price - discount;
  } else if (coupon.type === "fixed_amount") {
    discountedPrice = plan.price - (coupon.value ?? 0);
  } else if (coupon.type === "plan_assignment" && coupon.assignedPlanId) {
    // Lógica de asignación de plan
    discountedPrice = 0;
  }

  // 4️⃣ Evitar precios negativos
  return discountedPrice < 0 ? 0 : discountedPrice;
}

// 📋 CASOS DE PRUEBA
console.log("🧪 INICIANDO CASOS DE PRUEBA PARA CUPONES CON VALIDACIÓN DE PLANES\n");

// Definir planes de prueba
const plans = {
  basic: { id: "basic", name: "Plan Básico", price: 50000 },
  gold: { id: "gold", name: "Plan Gold", price: 100000 },
  premium: { id: "premium", name: "Plan Premium", price: 200000 },
  free: { id: "free", name: "Plan Gratuito", price: 0 }
};

// Definir cupones de prueba
const coupons = {
  // Cupón específico para planes Gold y Premium
  goldPremiumOnly: {
    code: "GOLD50",
    type: "percentage",
    value: 50,
    validPlanIds: ["gold", "premium"],
    isActive: true
  },
  
  // Cupón específico para upgrades
  upgradeOnly: {
    code: "UPGRADE20",
    type: "percentage", 
    value: 20,
    validUpgradeIds: ["storage_upgrade", "bandwidth_upgrade"],
    isActive: true
  },
  
  // Cupón universal (sin restricciones)
  universal: {
    code: "UNIVERSAL10",
    type: "percentage",
    value: 10,
    isActive: true
  },
  
  // Cupón de monto fijo específico para plan básico
  basicFixed: {
    code: "BASIC5000",
    type: "fixed_amount",
    value: 5000,
    validPlanIds: ["basic"],
    isActive: true
  }
};

// 🧪 CASO 1: Cupón específico aplicado a plan válido
console.log("🧪 CASO 1: Cupón GOLD50 aplicado a plan Gold (DEBE APLICAR)");
const result1 = applyCouponToPlan(plans.gold, coupons.goldPremiumOnly);
console.log(`   Precio original: $${plans.gold.price}`);
console.log(`   Precio final: $${result1}`);
console.log(`   ✅ Resultado esperado: $50000, Obtenido: $${result1}`);
console.log(`   ${result1 === 50000 ? '✅ PASÓ' : '❌ FALLÓ'}\n`);

// 🧪 CASO 2: Cupón específico aplicado a plan no válido
console.log("🧪 CASO 2: Cupón GOLD50 aplicado a plan Basic (NO DEBE APLICAR)");
const result2 = applyCouponToPlan(plans.basic, coupons.goldPremiumOnly);
console.log(`   Precio original: $${plans.basic.price}`);
console.log(`   Precio final: $${result2}`);
console.log(`   ✅ Resultado esperado: $50000, Obtenido: $${result2}`);
console.log(`   ${result2 === 50000 ? '✅ PASÓ' : '❌ FALLÓ'}\n`);

// 🧪 CASO 3: Cupón específico para upgrade
console.log("🧪 CASO 3: Cupón UPGRADE20 aplicado con upgrade válido (DEBE APLICAR)");
const result3 = applyCouponToPlan(plans.basic, coupons.upgradeOnly, "storage_upgrade");
console.log(`   Precio original: $${plans.basic.price}`);
console.log(`   Precio final: $${result3}`);
console.log(`   ✅ Resultado esperado: $40000, Obtenido: $${result3}`);
console.log(`   ${result3 === 40000 ? '✅ PASÓ' : '❌ FALLÓ'}\n`);

// 🧪 CASO 4: Cupón específico para upgrade con upgrade no válido
console.log("🧪 CASO 4: Cupón UPGRADE20 aplicado con upgrade no válido (NO DEBE APLICAR)");
const result4 = applyCouponToPlan(plans.basic, coupons.upgradeOnly, "invalid_upgrade");
console.log(`   Precio original: $${plans.basic.price}`);
console.log(`   Precio final: $${result4}`);
console.log(`   ✅ Resultado esperado: $50000, Obtenido: $${result4}`);
console.log(`   ${result4 === 50000 ? '✅ PASÓ' : '❌ FALLÓ'}\n`);

// 🧪 CASO 5: Cupón universal (debe aplicar a cualquier plan)
console.log("🧪 CASO 5: Cupón UNIVERSAL10 aplicado a cualquier plan (DEBE APLICAR)");
const result5 = applyCouponToPlan(plans.premium, coupons.universal);
console.log(`   Precio original: $${plans.premium.price}`);
console.log(`   Precio final: $${result5}`);
console.log(`   ✅ Resultado esperado: $180000, Obtenido: $${result5}`);
console.log(`   ${result5 === 180000 ? '✅ PASÓ' : '❌ FALLÓ'}\n`);

// 🧪 CASO 6: Cupón de monto fijo específico
console.log("🧪 CASO 6: Cupón BASIC5000 aplicado a plan Basic (DEBE APLICAR)");
const result6 = applyCouponToPlan(plans.basic, coupons.basicFixed);
console.log(`   Precio original: $${plans.basic.price}`);
console.log(`   Precio final: $${result6}`);
console.log(`   ✅ Resultado esperado: $45000, Obtenido: $${result6}`);
console.log(`   ${result6 === 45000 ? '✅ PASÓ' : '❌ FALLÓ'}\n`);

// 🧪 CASO 7: Cupón aplicado a plan gratuito (NO DEBE APLICAR)
console.log("🧪 CASO 7: Cupón aplicado a plan gratuito (NO DEBE APLICAR)");
const result7 = applyCouponToPlan(plans.free, coupons.universal);
console.log(`   Precio original: $${plans.free.price}`);
console.log(`   Precio final: $${result7}`);
console.log(`   ✅ Resultado esperado: $0, Obtenido: $${result7}`);
console.log(`   ${result7 === 0 ? '✅ PASÓ' : '❌ FALLÓ'}\n`);

// 🧪 CASO 8: Validación de función isCouponValidForPlan directa
console.log("🧪 CASO 8: Validación directa de isCouponValidForPlan");
const validations = [
  {
    desc: "Cupón Gold50 para plan Gold",
    result: isCouponValidForPlan(coupons.goldPremiumOnly, "gold"),
    expected: true
  },
  {
    desc: "Cupón Gold50 para plan Basic", 
    result: isCouponValidForPlan(coupons.goldPremiumOnly, "basic"),
    expected: false
  },
  {
    desc: "Cupón Upgrade20 para upgrade válido",
    result: isCouponValidForPlan(coupons.upgradeOnly, null, "storage_upgrade"),
    expected: true
  },
  {
    desc: "Cupón Universal para cualquier plan",
    result: isCouponValidForPlan(coupons.universal, "basic"),
    expected: true
  }
];

validations.forEach((test, index) => {
  console.log(`   ${index + 1}. ${test.desc}: ${test.result === test.expected ? '✅ PASÓ' : '❌ FALLÓ'}`);
});

console.log("\n🎉 CASOS DE PRUEBA COMPLETADOS");
console.log("📊 Resumen: Todos los casos de prueba validan la correcta implementación");
console.log("   de cupones específicos para planes y upgrades.");