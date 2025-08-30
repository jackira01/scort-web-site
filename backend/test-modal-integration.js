const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// Configurar conexión a MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

// Simular el flujo completo del modal de verificación
const testModalIntegration = async () => {
  try {
    console.log('🔍 Iniciando prueba de integración del modal de verificación...');

    const User = require('./src/modules/user/User.model');

    // Buscar un usuario para probar
    const testUser = await User.findOne().limit(1);

    if (!testUser) {
      console.log('❌ No se encontró ningún usuario para probar');
      return;
    }

    console.log(`\n📋 Usuario de prueba:`);
    console.log(`   ID: ${testUser._id}`);
    console.log(`   Nombre: ${testUser.name}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Estado inicial isVerified: ${testUser.isVerified}`);

    const API_URL = process.env.API_URL || 'http://localhost:3001';

    // Paso 1: Simular obtener el usuario (como lo haría el frontend)
    console.log('\n🔍 Paso 1: Obteniendo datos del usuario...');
    try {
      const getUserResponse = await axios.get(`${API_URL}/api/user/${testUser._id}`);
      console.log('✅ Usuario obtenido exitosamente:');
      console.log(`   isVerified: ${getUserResponse.data.isVerified}`);
      console.log(`   Estructura completa:`, getUserResponse.data);
    } catch (error) {
      console.error('❌ Error obteniendo usuario:', error.response?.data || error.message);
      return;
    }

    // Paso 2: Simular cambio de estado (toggle)
    const newVerificationStatus = !testUser.isVerified;
    console.log(`\n🔄 Paso 2: Cambiando estado de verificación a: ${newVerificationStatus}`);

    try {
      const updateResponse = await axios.put(`${API_URL}/api/user/${testUser._id}`, {
        isVerified: newVerificationStatus
      });

      console.log('✅ Respuesta de actualización:');
      console.log(`   Status: ${updateResponse.status}`);
      console.log(`   Success: ${updateResponse.data.success}`);
      console.log(`   Message: ${updateResponse.data.message}`);
      console.log(`   isVerified: ${updateResponse.data.isVerified}`);
      console.log(`   Estructura completa:`, updateResponse.data);

      // Paso 3: Verificar que el cambio se guardó en la base de datos
      console.log('\n🔍 Paso 3: Verificando cambio en la base de datos...');
      const updatedUser = await User.findById(testUser._id);
      console.log(`   Estado en BD: ${updatedUser.isVerified}`);

      if (updatedUser.isVerified === newVerificationStatus) {
        console.log('✅ ¡El cambio se guardó correctamente en la base de datos!');
      } else {
        console.log('❌ El cambio NO se guardó en la base de datos');
        console.log(`   Esperado: ${newVerificationStatus}`);
        console.log(`   Actual: ${updatedUser.isVerified}`);
      }

      // Paso 4: Simular segundo toggle (revertir)
      console.log(`\n🔄 Paso 4: Revirtiendo el cambio...`);
      const revertResponse = await axios.put(`${API_URL}/api/user/${testUser._id}`, {
        isVerified: testUser.isVerified // Volver al estado original
      });

      console.log('✅ Respuesta de reversión:');
      console.log(`   isVerified: ${revertResponse.data.isVerified}`);

      // Verificación final
      const finalUser = await User.findById(testUser._id);
      console.log(`\n🔍 Verificación final:`);
      console.log(`   Estado original: ${testUser.isVerified}`);
      console.log(`   Estado final: ${finalUser.isVerified}`);

      if (finalUser.isVerified === testUser.isVerified) {
        console.log('✅ ¡La reversión funcionó correctamente!');
      } else {
        console.log('❌ La reversión no funcionó');
      }

    } catch (updateError) {
      console.error('❌ Error en la actualización:');
      if (updateError.response) {
        console.error(`   Status: ${updateError.response.status}`);
        console.error(`   Data:`, updateError.response.data);
      } else {
        console.error(`   Error: ${updateError.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error general en la prueba:', error);
  }
};

// Función para probar múltiples usuarios
const testMultipleUsers = async () => {
  try {
    console.log('\n🔍 Probando con múltiples usuarios...');

    const User = require('./src/modules/user/User.model');
    const users = await User.find().limit(3);

    console.log(`📊 Encontrados ${users.length} usuarios para probar`);

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`\n👤 Usuario ${i + 1}:`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Nombre: ${user.name}`);
      console.log(`   isVerified: ${user.isVerified}`);

      // Probar actualización rápida
      const API_URL = process.env.API_URL || 'http://localhost:3001';
      try {
        const response = await axios.put(`${API_URL}/api/user/${user._id}`, {
          isVerified: !user.isVerified
        });
        console.log(`   ✅ Actualización exitosa: ${response.data.isVerified}`);

        // Revertir inmediatamente
        await axios.put(`${API_URL}/api/user/${user._id}`, {
          isVerified: user.isVerified
        });
        console.log(`   ↩️ Revertido al estado original`);

      } catch (error) {
        console.log(`   ❌ Error: ${error.response?.data?.message || error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error en prueba múltiple:', error);
  }
};

// Ejecutar todas las pruebas
const runAllTests = async () => {
  await connectDB();

  console.log('🚀 Iniciando suite de pruebas del modal de verificación\n');
  console.log('='.repeat(60));

  await testModalIntegration();

  console.log('\n' + '='.repeat(60));

  await testMultipleUsers();

  await mongoose.disconnect();
  console.log('\n🔚 Todas las pruebas completadas');
};

runAllTests().catch(console.error);