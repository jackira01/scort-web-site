const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/scort-web');
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

// User model (simplified)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  isVerified: { type: Boolean, default: false },
  verification_in_progress: { type: Boolean, default: false }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Test function
const testProfileCarouselToggle = async () => {
  try {
    console.log('🧪 === PRUEBA DE TOGGLE EN PROFILE VERIFICATION CAROUSEL ===\n');

    // Find a test user
    let testUser = await User.findOne({ email: { $regex: /test|demo/i } });

    if (!testUser) {
      // Create a test user if none exists
      testUser = new User({
        name: 'Test User for Carousel',
        email: 'test-carousel@example.com',
        isVerified: false,
        verification_in_progress: false
      });
      await testUser.save();
      console.log('👤 Usuario de prueba creado:', testUser._id);
    }

    console.log('📋 Estado inicial del usuario:');
    console.log(`   ID: ${testUser._id}`);
    console.log(`   Nombre: ${testUser.name}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   isVerified: ${testUser.isVerified}`);
    console.log(`   verification_in_progress: ${testUser.verification_in_progress}\n`);

    // Test 1: Toggle verification ON
    console.log('🔄 PRUEBA 1: Activando verificación...');
    const toggleOnResponse = await axios.put(
      `http://localhost:3001/api/user/${testUser._id}`,
      {
        isVerified: true,
        verification_in_progress: false
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('📡 Respuesta del servidor (ON):', JSON.stringify(toggleOnResponse.data, null, 2));

    // Verify in database
    const updatedUser1 = await User.findById(testUser._id);
    console.log('🔍 Estado en BD después de activar:');
    console.log(`   isVerified: ${updatedUser1.isVerified}`);
    console.log(`   verification_in_progress: ${updatedUser1.verification_in_progress}\n`);

    // Test 2: Toggle verification OFF
    console.log('🔄 PRUEBA 2: Desactivando verificación...');
    const toggleOffResponse = await axios.put(
      `http://localhost:3001/api/user/${testUser._id}`,
      {
        isVerified: false,
        verification_in_progress: false
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('📡 Respuesta del servidor (OFF):', JSON.stringify(toggleOffResponse.data, null, 2));

    // Verify in database
    const updatedUser2 = await User.findById(testUser._id);
    console.log('🔍 Estado en BD después de desactivar:');
    console.log(`   isVerified: ${updatedUser2.isVerified}`);
    console.log(`   verification_in_progress: ${updatedUser2.verification_in_progress}\n`);

    // Test 3: Multiple rapid toggles (simulate UI behavior)
    console.log('🔄 PRUEBA 3: Toggles rápidos múltiples...');

    for (let i = 0; i < 3; i++) {
      const newStatus = i % 2 === 0;
      console.log(`   Toggle ${i + 1}: ${newStatus ? 'ON' : 'OFF'}`);

      const response = await axios.put(
        `http://localhost:3001/api/user/${testUser._id}`,
        {
          isVerified: newStatus,
          verification_in_progress: false
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const dbUser = await User.findById(testUser._id);
      console.log(`   Respuesta: isVerified=${response.data.isVerified || response.data.data?.isVerified}`);
      console.log(`   BD: isVerified=${dbUser.isVerified}`);

      // Small delay to simulate real usage
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n✅ === TODAS LAS PRUEBAS COMPLETADAS ===');
    console.log('\n📝 RESUMEN:');
    console.log('- Si ves "success: true" en las respuestas, el backend está funcionando');
    console.log('- Si los valores en BD coinciden con las respuestas, la actualización funciona');
    console.log('- Si hay discrepancias, revisa los logs del servidor backend');

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    if (error.response) {
      console.error('📡 Respuesta del servidor:', error.response.data);
      console.error('📊 Status:', error.response.status);
    }
  }
};

// Run the test
const runTest = async () => {
  await connectDB();
  await testProfileCarouselToggle();
  await mongoose.disconnect();
  console.log('\n🔌 Desconectado de MongoDB');
  process.exit(0);
};

runTest().catch(console.error);