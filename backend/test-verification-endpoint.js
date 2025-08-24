const axios = require('axios');

// Configuración del servidor
const BASE_URL = 'http://localhost:3001/api';

// Función para probar la conectividad del servidor
async function testServerConnection() {
  try {
    console.log('🔗 Probando conexión al servidor...');
    const response = await axios.get(`${BASE_URL}/profiles?limit=1`);
    console.log('✅ Servidor conectado correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error de conexión al servidor:');
    if (error.code === 'ECONNREFUSED') {
      console.error('   El servidor no está ejecutándose en el puerto 3001');
    } else {
      console.error('   Error:', error.message);
    }
    return false;
  }
}

// Función para obtener algunos perfiles y verificar su estado
async function checkProfilesVerificationStatus() {
  try {
    console.log('\n📋 Obteniendo perfiles para verificar su estado...');
    const response = await axios.get(`${BASE_URL}/profiles?limit=10`);
    
    if (!response.data || response.data.length === 0) {
      console.log('⚠️  No se encontraron perfiles en la base de datos');
      return;
    }
    
    console.log(`📊 Se encontraron ${response.data.length} perfiles`);
    
    let profilesWithVerification = 0;
    let profilesWithoutVerification = 0;
    
    response.data.forEach((profile, index) => {
      const hasVerification = profile.verification && profile.verification !== null;
      console.log(`${index + 1}. ${profile.name} (${profile._id})`);
      console.log(`   Verification: ${hasVerification ? profile.verification : 'null/undefined'}`);
      
      if (hasVerification) {
        profilesWithVerification++;
      } else {
        profilesWithoutVerification++;
      }
    });
    
    console.log(`\n📈 Resumen:`);
    console.log(`   ✅ Perfiles con verificación: ${profilesWithVerification}`);
    console.log(`   ❌ Perfiles sin verificación: ${profilesWithoutVerification}`);
    
    return profilesWithoutVerification > 0;
    
  } catch (error) {
    console.error('❌ Error al obtener perfiles:', error.message);
    return false;
  }
}

// Función para ejecutar el endpoint de crear verificaciones faltantes
async function executeCreateMissingVerifications() {
  try {
    console.log('\n🔧 Ejecutando endpoint para crear verificaciones faltantes...');
    
    const response = await axios.post(`${BASE_URL}/profiles/create-missing-verifications`, {}, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 segundos de timeout
    });
    
    console.log('✅ Endpoint ejecutado exitosamente');
    console.log('📄 Respuesta del servidor:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      const { total, created, errors } = response.data.data;
      console.log(`\n📊 Resultados:`);
      console.log(`   📋 Total de perfiles procesados: ${total}`);
      console.log(`   ✅ Verificaciones creadas: ${created}`);
      console.log(`   ❌ Errores: ${errors}`);
      
      if (created > 0) {
        console.log('\n🎉 ¡Se crearon verificaciones exitosamente!');
      } else if (total === 0) {
        console.log('\n✅ Todos los perfiles ya tienen verificaciones');
      }
      
      // Mostrar detalles de errores si los hay
      if (errors > 0 && response.data.data.results) {
        console.log('\n🚨 Detalles de errores:');
        response.data.data.results
          .filter(r => r.status === 'error')
          .forEach((result, index) => {
            console.log(`${index + 1}. Perfil: ${result.profileName} (${result.profileId})`);
            console.log(`   Error: ${result.error}`);
          });
      }
    }
    
    return response.data.success;
    
  } catch (error) {
    console.error('❌ Error al ejecutar el endpoint:');
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('   No se recibió respuesta del servidor');
      console.error('   Request:', error.request);
    } else {
      console.error('   Error:', error.message);
    }
    
    return false;
  }
}

// Función para verificar el estado después de la corrección
async function verifyAfterCorrection() {
  console.log('\n🔍 Verificando estado después de la corrección...');
  await checkProfilesVerificationStatus();
}

// Función principal
async function main() {
  console.log('🚀 Iniciando prueba del endpoint de verificaciones');
  console.log('=' .repeat(60));
  
  // 1. Probar conexión al servidor
  const serverConnected = await testServerConnection();
  if (!serverConnected) {
    console.log('\n❌ No se puede continuar sin conexión al servidor');
    console.log('💡 Asegúrate de que el servidor backend esté ejecutándose en el puerto 3001');
    return;
  }
  
  // 2. Verificar estado inicial
  const hasProfilesWithoutVerification = await checkProfilesVerificationStatus();
  
  // 3. Ejecutar corrección si es necesario
  if (hasProfilesWithoutVerification) {
    console.log('\n🔧 Se encontraron perfiles sin verificación. Ejecutando corrección...');
    const success = await executeCreateMissingVerifications();
    
    if (success) {
      // 4. Verificar estado después de la corrección
      await verifyAfterCorrection();
    }
  } else {
    console.log('\n✅ Todos los perfiles ya tienen verificaciones. No es necesario ejecutar corrección.');
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ Prueba completada');
}

// Ejecutar el script
main().catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});