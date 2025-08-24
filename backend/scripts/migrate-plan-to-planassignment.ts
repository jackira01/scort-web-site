import mongoose from 'mongoose';
import { ProfileModel } from '../src/modules/profile/profile.model';
import { PlanDefinitionModel } from '../src/modules/plans/plan.model';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Modelo del Plan antiguo (para referencia)
const OldPlanSchema = new mongoose.Schema({
  name: String,
  code: String,
  level: Number,
  // otros campos del plan antiguo
});

const OldPlanModel = mongoose.model('Plan', OldPlanSchema);

async function migratePlanToPlanAssignment() {
  try {
    console.log('🚀 Iniciando migración de plan a planAssignment...');
    
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/scort-web-site');
    console.log('✅ Conectado a MongoDB');

    // Buscar perfiles que tienen 'plan' pero no tienen 'planAssignment'
    const profilesToMigrate = await ProfileModel.find({
      plan: { $exists: true, $ne: null },
      planAssignment: null
    });

    console.log(`📊 Encontrados ${profilesToMigrate.length} perfiles para migrar`);

    if (profilesToMigrate.length === 0) {
      console.log('✅ No hay perfiles que migrar');
      return;
    }

    // Obtener todas las definiciones de planes activos
    const planDefinitions = await PlanDefinitionModel.find({ active: true });
    const planCodeToDefinition = planDefinitions.reduce((acc, plan) => {
      acc[plan.code] = plan;
      return acc;
    }, {} as Record<string, any>);

    console.log('📋 Definiciones de planes disponibles:', Object.keys(planCodeToDefinition));

    let migratedCount = 0;
    let skippedCount = 0;

    for (const profile of profilesToMigrate) {
      try {
        // Obtener información del plan desde la colección de planes
        const oldPlan = await OldPlanModel.findById(profile.plan);
        
        if (!oldPlan || !oldPlan.code) {
          console.log(`⚠️  Perfil ${profile.name} tiene plan sin código, saltando...`);
          skippedCount++;
          continue;
        }

        // Buscar la definición del plan correspondiente
        const planDefinition = planCodeToDefinition[oldPlan.code];
        
        if (!planDefinition) {
          console.log(`⚠️  No se encontró definición para el plan ${oldPlan.code}, saltando perfil ${profile.name}...`);
          skippedCount++;
          continue;
        }

        // Determinar la variante por defecto (la más larga disponible)
        const defaultVariant = planDefinition.variants.reduce((longest: any, current: any) => {
          return current.days > longest.days ? current : longest;
        });

        // Crear el planAssignment
        const now = new Date();
        const expiresAt = new Date(now.getTime() + (defaultVariant.days * 24 * 60 * 60 * 1000));

        const planAssignment = {
          planCode: planDefinition.code,
          variantDays: defaultVariant.days,
          startAt: now,
          expiresAt: expiresAt
        };

        // Actualizar el perfil: crear planAssignment y eliminar plan
        await ProfileModel.findByIdAndUpdate(profile._id, {
          planAssignment: planAssignment,
          visible: true, // Asegurar que esté visible
          $unset: { plan: 1 } // Eliminar el campo plan antiguo
        });

        console.log(`✅ Migrado perfil ${profile.name}: ${oldPlan.code} -> planAssignment (${defaultVariant.days} días)`);
        migratedCount++;

      } catch (error) {
        console.error(`❌ Error migrando perfil ${profile.name}:`, error);
        skippedCount++;
      }
    }

    console.log('\n📊 Resumen de migración:');
    console.log(`✅ Perfiles migrados: ${migratedCount}`);
    console.log(`⚠️  Perfiles saltados: ${skippedCount}`);
    console.log(`📋 Total procesados: ${migratedCount + skippedCount}`);

    // Verificar la migración
    console.log('\n🔍 Verificando migración...');
    const remainingProfiles = await ProfileModel.countDocuments({
      plan: { $exists: true, $ne: null },
      planAssignment: null
    });

    console.log(`📊 Perfiles restantes sin migrar: ${remainingProfiles}`);

    if (remainingProfiles === 0) {
      console.log('🎉 ¡Migración completada exitosamente!');
    } else {
      console.log('⚠️  Algunos perfiles no pudieron ser migrados');
    }

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Función para revertir la migración
// NOTA: Esta función solo elimina planAssignment ya que el campo 'plan' fue removido del modelo
// Para una reversión completa, sería necesario restaurar el campo 'plan' en el modelo primero
async function revertMigration() {
  try {
    console.log('🔄 Iniciando reversión de migración...');
    console.log('⚠️  ADVERTENCIA: Esta reversión solo elimina planAssignment. El campo plan ya no existe en el modelo.');
    
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/scort-web-site');
    console.log('✅ Conectado a MongoDB');

    const result = await ProfileModel.updateMany(
      { planAssignment: { $exists: true, $ne: null } },
      { $unset: { planAssignment: 1 } }
    );

    console.log(`✅ Reversión completada. ${result.modifiedCount} perfiles actualizados`);
    console.log('⚠️  Los perfiles ahora no tienen plan asignado. Considera ejecutar la migración nuevamente o asignar planes manualmente.');

  } catch (error) {
    console.error('❌ Error durante la reversión:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Ejecutar migración
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'revert') {
    revertMigration();
  } else {
    migratePlanToPlanAssignment();
  }
}

export { migratePlanToPlanAssignment, revertMigration };