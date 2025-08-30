const mongoose = require('mongoose');
const { ProfileModel } = require('./src/modules/profile/profile.model');
const UserModel = require('./src/modules/user/User.model').default;
require('dotenv').config();

async function debugHomeFeed() {
  try {
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const now = new Date();

    // 1. Obtener todos los perfiles visibles con plan activo
    console.log('\n🔍 Paso 1: Perfiles visibles con plan activo');
    const allVisibleProfiles = await ProfileModel.find({
      visible: true,
      isActive: true,
      'planAssignment.expiresAt': { $gt: now }
    }).select('_id user name visible isActive planAssignment');

    console.log(`Total perfiles visibles con plan activo: ${allVisibleProfiles.length}`);

    // 2. Verificar usuarios de estos perfiles
    console.log('\n🔍 Paso 2: Verificando usuarios de estos perfiles');
    const userIds = allVisibleProfiles.map(p => p.user).filter(Boolean);
    const users = await UserModel.find({ _id: { $in: userIds } }).select('_id name isVerified');

    console.log(`Total usuarios encontrados: ${users.length}`);
    console.log(`Usuarios verificados: ${users.filter(u => u.isVerified).length}`);
    console.log(`Usuarios NO verificados: ${users.filter(u => !u.isVerified).length}`);

    // 3. Mostrar detalles de usuarios no verificados
    const unverifiedUsers = users.filter(u => !u.isVerified);
    if (unverifiedUsers.length > 0) {
      console.log('\n❌ Usuarios NO verificados:');
      for (const user of unverifiedUsers) {
        const profilesCount = allVisibleProfiles.filter(p => p.user.toString() === user._id.toString()).length;
        console.log(`  - ${user.name} (ID: ${user._id}) - ${profilesCount} perfiles`);
      }
    }

    // 4. Probar el populate con match
    console.log('\n🔍 Paso 3: Probando populate con match');
    const profilesWithPopulate = await ProfileModel.find({
      visible: true,
      isActive: true,
      'planAssignment.expiresAt': { $gt: now }
    })
      .populate({
        path: 'user',
        match: { isVerified: true },
        select: 'isVerified name'
      })
      .select('_id name user')
      .exec();

    console.log(`Perfiles después del populate: ${profilesWithPopulate.length}`);

    // 5. Filtrar perfiles con usuario verificado
    const verifiedUserProfiles = profilesWithPopulate.filter(profile => profile.user);
    console.log(`Perfiles con usuario verificado (después del filtro): ${verifiedUserProfiles.length}`);

    // 6. Mostrar perfiles que pasaron el filtro
    console.log('\n✅ Perfiles que PASARON el filtro:');
    for (const profile of verifiedUserProfiles) {
      console.log(`  - Perfil: ${profile.name} (ID: ${profile._id})`);
      console.log(`    Usuario: ${profile.user.name} (Verificado: ${profile.user.isVerified})`);
    }

    // 7. Mostrar perfiles que NO pasaron el filtro
    const filteredOutProfiles = profilesWithPopulate.filter(profile => !profile.user);
    console.log(`\n❌ Perfiles que NO pasaron el filtro: ${filteredOutProfiles.length}`);

    if (filteredOutProfiles.length > 0) {
      console.log('Detalles de perfiles filtrados:');
      for (const profile of filteredOutProfiles.slice(0, 5)) { // Solo mostrar los primeros 5
        // Obtener el usuario original sin el match
        const originalUser = await UserModel.findById(profile.user).select('name isVerified');
        console.log(`  - Perfil: ${profile.name} (ID: ${profile._id})`);
        if (originalUser) {
          console.log(`    Usuario original: ${originalUser.name} (Verificado: ${originalUser.isVerified})`);
        } else {
          console.log(`    Usuario no encontrado`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

debugHomeFeed();