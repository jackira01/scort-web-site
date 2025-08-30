const mongoose = require('mongoose');
const { getProfilesForHome } = require('./src/modules/profile/profile.service');
require('dotenv').config();

async function testProfileHomeEndpoint() {
  try {
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    console.log('\n🧪 PRUEBA DEL ENDPOINT /api/profile/home');
    console.log('='.repeat(60));

    // Simular la llamada exacta que hace el frontend
    console.log('\n📞 Llamando a getProfilesForHome(1, 20)...');
    console.log('-'.repeat(40));

    const result = await getProfilesForHome(1, 20);

    console.log('\n📊 RESUMEN DE RESULTADOS:');
    console.log('-'.repeat(40));
    console.log(`Total perfiles devueltos: ${result.profiles.length}`);
    console.log(`Total disponible: ${result.pagination.total}`);
    console.log(`Página actual: ${result.pagination.page}`);
    console.log(`Límite por página: ${result.pagination.limit}`);
    console.log(`Total páginas: ${result.pagination.pages}`);

    console.log('\n👥 ANÁLISIS DE USUARIOS:');
    console.log('-'.repeat(40));

    let verifiedCount = 0;
    let unverifiedCount = 0;
    let noUserCount = 0;

    result.profiles.forEach((profile, index) => {
      if (profile.user) {
        if (profile.user.isVerified === true) {
          verifiedCount++;
        } else {
          unverifiedCount++;
          console.log(`❌ PROBLEMA - Perfil ${index + 1}: ${profile.name}`);
          console.log(`   Usuario: ${profile.user.name || profile.user.email}`);
          console.log(`   isVerified: ${profile.user.isVerified}`);
        }
      } else {
        noUserCount++;
        console.log(`⚠️  Sin usuario - Perfil ${index + 1}: ${profile.name}`);
      }
    });

    console.log(`\n📈 ESTADÍSTICAS:`);
    console.log(`   ✅ Perfiles con usuarios verificados: ${verifiedCount}`);
    console.log(`   ❌ Perfiles con usuarios NO verificados: ${unverifiedCount}`);
    console.log(`   ⚠️  Perfiles sin información de usuario: ${noUserCount}`);

    if (unverifiedCount === 0 && noUserCount === 0) {
      console.log('\n🎉 ¡ÉXITO! Todos los perfiles son de usuarios verificados');
    } else {
      console.log('\n💥 ¡PROBLEMA! Hay perfiles de usuarios no verificados o sin usuario');
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

testProfileHomeEndpoint();