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

// Función para probar la actualización de usuario
const testUserUpdate = async () => {
  try {
    console.log('🔍 Iniciando prueba de actualización de usuario...');

    // Obtener un usuario de prueba de la base de datos
    const User = require('./src/modules/user/User.model');
    const testUser = await User.findOne().limit(1);

    if (!testUser) {
      console.log('❌ No se encontró ningún usuario para probar');
      return;
    }

    console.log(`📋 Usuario de prueba encontrado:`);
    console.log(`   ID: ${testUser._id}`);
    console.log(`   Nombre: ${testUser.name}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Estado actual isVerified: ${testUser.isVerified}`);

    // Probar actualización directa en la base de datos
    console.log('\n🔄 Probando actualización directa en la base de datos...');
    const newVerificationStatus = !testUser.isVerified;

    const updatedUser = await User.findByIdAndUpdate(
      testUser._id,
      { isVerified: newVerificationStatus },
      { new: true }
    );

    console.log(`✅ Actualización directa exitosa:`);
    console.log(`   Nuevo estado isVerified: ${updatedUser.isVerified}`);

    // Probar el endpoint HTTP
    console.log('\n🌐 Probando endpoint HTTP PUT /api/user/:id...');

    const API_URL = process.env.API_URL || 'http://localhost:3001';
    const endpoint = `${API_URL}/api/user/${testUser._id}`;

    console.log(`📡 Enviando PUT a: ${endpoint}`);
    console.log(`📦 Datos a enviar: { isVerified: ${!newVerificationStatus} }`);

    try {
      const response = await axios.put(endpoint, {
        isVerified: !newVerificationStatus
      });

      console.log(`✅ Respuesta del endpoint:`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Data:`, response.data);

      // Verificar que la actualización se guardó correctamente
      const finalUser = await User.findById(testUser._id);
      console.log(`\n🔍 Verificación final en la base de datos:`);
      console.log(`   Estado final isVerified: ${finalUser.isVerified}`);

      if (finalUser.isVerified === !newVerificationStatus) {
        console.log('✅ ¡La actualización funcionó correctamente!');
      } else {
        console.log('❌ La actualización no se reflejó en la base de datos');
      }

    } catch (httpError) {
      console.error('❌ Error en el endpoint HTTP:');
      if (httpError.response) {
        console.error(`   Status: ${httpError.response.status}`);
        console.error(`   Data:`, httpError.response.data);
      } else {
        console.error(`   Error: ${httpError.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
};

// Ejecutar la prueba
const runTest = async () => {
  await connectDB();
  await testUserUpdate();
  await mongoose.disconnect();
  console.log('\n🔚 Prueba completada');
};

runTest().catch(console.error);