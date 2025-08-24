const mongoose = require('mongoose');
require('dotenv').config();

// Conectar a MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/scort-db');
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
}

// Definir esquemas básicos para la consulta directa
const ProfileSchema = new mongoose.Schema({
  name: String,
  verification: { type: mongoose.Schema.Types.ObjectId, ref: 'ProfileVerification' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  visible: Boolean,
  createdAt: Date
}, { collection: 'profiles' });

const ProfileVerificationSchema = new mongoose.Schema({
  profile: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
  verificationStatus: String,
  verificationProgress: Number,
  steps: Object,
  createdAt: Date
}, { collection: 'profileverifications' });

const Profile = mongoose.model('ProfileDebug', ProfileSchema);
const ProfileVerification = mongoose.model('ProfileVerificationDebug', ProfileVerificationSchema);

// Función para analizar el estado actual
async function analyzeCurrentState() {
  console.log('🔍 Analizando estado actual de perfiles y verificaciones...');
  console.log('=' .repeat(70));
  
  try {
    // Contar total de perfiles
    const totalProfiles = await Profile.countDocuments();
    console.log(`📊 Total de perfiles en la base de datos: ${totalProfiles}`);
    
    // Contar perfiles sin verificación
    const profilesWithoutVerification = await Profile.countDocuments({
      $or: [
        { verification: null },
        { verification: { $exists: false } }
      ]
    });
    console.log(`❌ Perfiles sin campo verification: ${profilesWithoutVerification}`);
    
    // Contar perfiles con verificación
    const profilesWithVerification = await Profile.countDocuments({
      verification: { $exists: true, $ne: null }
    });
    console.log(`✅ Perfiles con campo verification: ${profilesWithVerification}`);
    
    // Contar total de documentos de verificación
    const totalVerifications = await ProfileVerification.countDocuments();
    console.log(`📋 Total de documentos ProfileVerification: ${totalVerifications}`);
    
    console.log('\n' + '-'.repeat(50));
    
    // Mostrar algunos ejemplos de perfiles sin verificación
    if (profilesWithoutVerification > 0) {
      console.log('\n🔍 Ejemplos de perfiles sin verificación:');
      const examplesWithoutVerification = await Profile.find({
        $or: [
          { verification: null },
          { verification: { $exists: false } }
        ]
      }).limit(5).select('name _id verification createdAt');
      
      examplesWithoutVerification.forEach((profile, index) => {
        console.log(`${index + 1}. ${profile.name} (${profile._id})`);
        console.log(`   Verification: ${profile.verification || 'null/undefined'}`);
        console.log(`   Creado: ${profile.createdAt}`);
      });
    }
    
    // Mostrar algunos ejemplos de perfiles con verificación
    if (profilesWithVerification > 0) {
      console.log('\n✅ Ejemplos de perfiles con verificación:');
      const examplesWithVerification = await Profile.find({
        verification: { $exists: true, $ne: null }
      }).limit(5).select('name _id verification createdAt').populate('verification', 'verificationStatus verificationProgress');
      
      examplesWithVerification.forEach((profile, index) => {
        console.log(`${index + 1}. ${profile.name} (${profile._id})`);
        console.log(`   Verification ID: ${profile.verification?._id || profile.verification}`);
        if (profile.verification && typeof profile.verification === 'object') {
          console.log(`   Status: ${profile.verification.verificationStatus}`);
          console.log(`   Progress: ${profile.verification.verificationProgress}%`);
        }
        console.log(`   Creado: ${profile.createdAt}`);
      });
    }
    
    // Verificar verificaciones huérfanas (sin perfil asociado)
    console.log('\n🔍 Verificando verificaciones huérfanas...');
    const orphanVerifications = await ProfileVerification.find().populate('profile');
    const orphanCount = orphanVerifications.filter(v => !v.profile).length;
    console.log(`🚨 Verificaciones huérfanas (sin perfil): ${orphanCount}`);
    
    if (orphanCount > 0) {
      const orphans = orphanVerifications.filter(v => !v.profile).slice(0, 3);
      orphans.forEach((verification, index) => {
        console.log(`${index + 1}. Verification ID: ${verification._id}`);
        console.log(`   Profile ID referenciado: ${verification.profile}`);
        console.log(`   Status: ${verification.verificationStatus}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error durante el análisis:', error);
  }
}

// Función para probar la creación de una verificación manualmente
async function testVerificationCreation() {
  console.log('\n🧪 Probando creación manual de verificación...');
  console.log('=' .repeat(50));
  
  try {
    // Buscar un perfil sin verificación
    const profileWithoutVerification = await Profile.findOne({
      $or: [
        { verification: null },
        { verification: { $exists: false } }
      ]
    });
    
    if (!profileWithoutVerification) {
      console.log('✅ No hay perfiles sin verificación para probar');
      return;
    }
    
    console.log(`🎯 Perfil seleccionado: ${profileWithoutVerification.name} (${profileWithoutVerification._id})`);
    
    // Crear verificación manualmente
    const newVerification = new ProfileVerification({
      profile: profileWithoutVerification._id,
      verificationStatus: 'pending',
      verificationProgress: 0,
      steps: {
        documentPhotos: {
          documents: [],
          isVerified: false
        },
        selfieWithPoster: {
          photo: undefined,
          isVerified: false
        },
        selfieWithDoc: {
          photo: undefined,
          isVerified: false
        },
        fullBodyPhotos: {
          photos: [],
          isVerified: false
        },
        video: {
          videoLink: undefined,
          isVerified: false
        },
        videoCallRequested: {
          videoLink: undefined,
          isVerified: false
        },
        socialMedia: {
          accounts: [],
          isVerified: false
        },
        phoneChangeDetected: false,
        lastLogin: {
          isVerified: true,
          date: null
        }
      }
    });
    
    await newVerification.save();
    console.log(`✅ Verificación creada: ${newVerification._id}`);
    
    // Actualizar el perfil con la referencia
    await Profile.findByIdAndUpdate(
      profileWithoutVerification._id,
      { verification: newVerification._id }
    );
    console.log(`✅ Perfil actualizado con referencia a verificación`);
    
    // Verificar que la actualización funcionó
    const updatedProfile = await Profile.findById(profileWithoutVerification._id).populate('verification');
    console.log(`🔍 Verificación del perfil actualizado:`);
    console.log(`   Verification ID: ${updatedProfile.verification?._id}`);
    console.log(`   Status: ${updatedProfile.verification?.verificationStatus}`);
    
  } catch (error) {
    console.error('❌ Error durante la prueba de creación:', error);
  }
}

// Función principal
async function main() {
  await connectDB();
  
  await analyzeCurrentState();
  await testVerificationCreation();
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ Análisis completado');
  
  await mongoose.disconnect();
  console.log('👋 Desconectado de MongoDB');
}

main().catch(console.error);