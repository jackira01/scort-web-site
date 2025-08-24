const axios = require('axios');

// Script para probar el endpoint de crear verificaciones faltantes
async function testCreateMissingVerifications() {
  try {
    console.log('🔍 Ejecutando endpoint para crear verificaciones faltantes...');
    
    const response = await axios.post('http://localhost:3001/api/profiles/create-missing-verifications', {}, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Respuesta del servidor:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log(`\n📊 Resumen:`);
      console.log(`- Total de perfiles sin verificación: ${response.data.data.total}`);
      console.log(`- Verificaciones creadas exitosamente: ${response.data.data.created}`);
      console.log(`- Errores encontrados: ${response.data.data.errors}`);
      
      if (response.data.data.results && response.data.data.results.length > 0) {
        console.log('\n📋 Detalles de los resultados:');
        response.data.data.results.forEach((result, index) => {
          console.log(`${index + 1}. Perfil: ${result.profileName} (${result.profileId})`);
          console.log(`   Estado: ${result.status}`);
          if (result.status === 'created') {
            console.log(`   Verificación ID: ${result.verificationId}`);
          } else if (result.status === 'error') {
            console.log(`   Error: ${result.error}`);
          }
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error al ejecutar el endpoint:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Función para verificar algunos perfiles específicos
async function checkSpecificProfiles() {
  try {
    console.log('\n🔍 Verificando algunos perfiles específicos...');
    
    // Obtener lista de perfiles
    const profilesResponse = await axios.get('http://localhost:3001/api/profiles?limit=5');
    
    if (profilesResponse.data && profilesResponse.data.length > 0) {
      console.log(`\n📋 Revisando ${profilesResponse.data.length} perfiles:`);
      
      for (const profile of profilesResponse.data) {
        console.log(`\n- Perfil: ${profile.name} (${profile._id})`);
        console.log(`  Verification field: ${profile.verification || 'null/undefined'}`);
        
        // Si el perfil tiene verification, intentar obtener los detalles
        if (profile.verification) {
          try {
            const verificationResponse = await axios.get(`http://localhost:3001/api/profile-verifications/${profile.verification}`);
            console.log(`  Verification status: ${verificationResponse.data.verificationStatus}`);
            console.log(`  Verification progress: ${verificationResponse.data.verificationProgress}%`);
          } catch (verError) {
            console.log(`  ⚠️  Error al obtener detalles de verificación: ${verError.message}`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error al verificar perfiles específicos:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Ejecutar las pruebas
async function runTests() {
  console.log('🚀 Iniciando pruebas de verificaciones de perfiles...');
  console.log('=' .repeat(60));
  
  await checkSpecificProfiles();
  
  console.log('\n' + '=' .repeat(60));
  
  await testCreateMissingVerifications();
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ Pruebas completadas');
}

runTests();