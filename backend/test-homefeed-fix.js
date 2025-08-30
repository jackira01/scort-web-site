const mongoose = require('mongoose');
const { getHomeFeed, getHomeFeedStats } = require('./src/modules/feeds/feeds.service');
const { ProfileModel } = require('./src/modules/profile/profile.model');
const UserModel = require('./src/modules/user/User.model').default;
require('dotenv').config();

async function testHomeFeedFix() {
  try {
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // 1. Buscar un usuario no verificado con múltiples perfiles
    console.log('\n🔍 Buscando usuario no verificado con múltiples perfiles...');
    const unverifiedUser = await UserModel.findOne({ isVerified: false });

    if (!unverifiedUser) {
      console.log('❌ No se encontró ningún usuario no verificado');
      return;
    }

    console.log(`Usuario encontrado: ${unverifiedUser.name} (ID: ${unverifiedUser._id})`);
    console.log(`Estado de verificación: ${unverifiedUser.isVerified}`);

    // 2. Contar perfiles de este usuario
    const userProfiles = await ProfileModel.find({ user: unverifiedUser._id });
    console.log(`Perfiles del usuario: ${userProfiles.length}`);

    const activeVisibleProfiles = await ProfileModel.find({
      user: unverifiedUser._id,
      visible: true,
      isActive: true,
      'planAssignment.expiresAt': { $gt: new Date() }
    });
    console.log(`Perfiles activos y visibles: ${activeVisibleProfiles.length}`);

    // 3. Probar el homeFeed antes del fix
    console.log('\n🧪 Probando homeFeed con la nueva implementación...');
    const homeFeed = await getHomeFeed({ page: 1, pageSize: 50 });
    console.log(`Total perfiles en homeFeed: ${homeFeed.profiles.length}`);

    // 4. Verificar si algún perfil del usuario no verificado aparece
    const userProfilesInFeed = homeFeed.profiles.filter(profile =>
      profile.user && profile.user._id.toString() === unverifiedUser._id.toString()
    );

    console.log(`Perfiles del usuario no verificado en el feed: ${userProfilesInFeed.length}`);

    if (userProfilesInFeed.length > 0) {
      console.log('❌ ERROR: Perfiles de usuario no verificado aparecen en el feed!');
      userProfilesInFeed.forEach((profile, index) => {
        console.log(`  ${index + 1}. ${profile.name} (ID: ${profile._id})`);
      });
    } else {
      console.log('✅ CORRECTO: No aparecen perfiles de usuarios no verificados');
    }

    // 5. Verificar todos los usuarios en el feed
    console.log('\n🔍 Verificando todos los usuarios en el feed...');
    const allUsersInFeed = homeFeed.profiles.map(p => p.user).filter(Boolean);
    const unverifiedInFeed = allUsersInFeed.filter(user => !user.isVerified);

    console.log(`Total usuarios en el feed: ${allUsersInFeed.length}`);
    console.log(`Usuarios no verificados en el feed: ${unverifiedInFeed.length}`);

    if (unverifiedInFeed.length > 0) {
      console.log('❌ ERROR: Hay usuarios no verificados en el feed!');
      unverifiedInFeed.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.name} (Verificado: ${user.isVerified})`);
      });
    } else {
      console.log('✅ CORRECTO: Todos los usuarios en el feed están verificados');
    }

    // 6. Probar estadísticas
    console.log('\n📊 Probando estadísticas del homeFeed...');
    const stats = await getHomeFeedStats();
    console.log('Estadísticas por nivel:', stats);
    const totalInStats = Object.values(stats).reduce((sum, count) => sum + count, 0);
    console.log(`Total perfiles en estadísticas: ${totalInStats}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

testHomeFeedFix();