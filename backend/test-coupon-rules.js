// 🧪 Prueba simple de las reglas de negocio para cupones

const applyCouponToPlan = (plan, coupon) => {
  const originalPrice = plan.price;

  // 1. Si no hay cupón, no hay descuento
  if (!coupon) {
    return {
      originalPrice,
      finalPrice: originalPrice,
      discount: 0,
      success: true
    };
  }

  // 2. 🚫 REGLA DE NEGOCIO: Si el plan es gratuito, no se puede aplicar cupón
  if (plan.price <= 0) {
    return {
      originalPrice,
      finalPrice: 0,
      discount: 0,
      success: false,
      error: 'El cupón no puede aplicarse a planes gratuitos'
    };
  }

  let discountedPrice = plan.price;
  let discount = 0;

  // 3. Aplicar descuento según tipo
  if (coupon.type === "PERCENTAGE") {
    discount = (plan.price * coupon.value) / 100;
    discountedPrice = plan.price - discount;
  } else if (coupon.type === "FIXED") {
    discount = coupon.value;
    discountedPrice = plan.price - coupon.value;
  }

  // 4. 🛡️ REGLA DE NEGOCIO: Evitar precios negativos (forzar mínimo 0)
  if (discountedPrice < 0) {
    discount = originalPrice; // El descuento máximo es el precio original
    discountedPrice = 0;
  }

  return {
    originalPrice,
    finalPrice: discountedPrice,
    discount,
    success: true
  };
};

// 📊 Casos de prueba
const testCases = [
  {
    description: "Plan gratuito con cupón 50%",
    plan: { price: 0 },
    coupon: { type: "PERCENTAGE", value: 50 },
    expected: { finalPrice: 0, success: false }
  },
  {
    description: "Plan $100.000 con cupón 50%",
    plan: { price: 100000 },
    coupon: { type: "PERCENTAGE", value: 50 },
    expected: { finalPrice: 50000, success: true }
  },
  {
    description: "Plan $100.000 con cupón fijo $120.000",
    plan: { price: 100000 },
    coupon: { type: "FIXED", value: 120000 },
    expected: { finalPrice: 0, success: true }
  },
  {
    description: "Plan $200.000 con cupón fijo $50.000",
    plan: { price: 200000 },
    coupon: { type: "FIXED", value: 50000 },
    expected: { finalPrice: 150000, success: true }
  }
];

console.log('🧪 Ejecutando pruebas de reglas de negocio para cupones...\n');

let allTestsPassed = true;

testCases.forEach((testCase, index) => {
  const result = applyCouponToPlan(testCase.plan, testCase.coupon);
  
  const passed = 
    result.finalPrice === testCase.expected.finalPrice &&
    result.success === testCase.expected.success;

  console.log(`Test ${index + 1}: ${testCase.description}`);
  console.log(`  Plan: $${testCase.plan.price.toLocaleString()}`);
  console.log(`  Cupón: ${testCase.coupon?.type} ${testCase.coupon?.value}`);
  console.log(`  Esperado: $${testCase.expected.finalPrice.toLocaleString()}`);
  console.log(`  Resultado: $${result.finalPrice.toLocaleString()}`);
  console.log(`  Estado: ${passed ? '✅ PASÓ' : '❌ FALLÓ'}\n`);

  if (!passed) {
    allTestsPassed = false;
  }
});

console.log(`Resultado final: ${allTestsPassed ? '✅ Todas las pruebas pasaron' : '❌ Algunas pruebas fallaron'}`);