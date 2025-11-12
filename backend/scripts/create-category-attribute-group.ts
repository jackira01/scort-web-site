import mongoose from 'mongoose';
import { config } from 'dotenv';
import { AttributeGroupModel } from '../src/modules/attribute-group/attribute-group.model';

// Cargar variables de entorno
config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/scort-web-site';

/**
 * Script para crear el AttributeGroup de 'category' con las categorías principales
 * Este grupo es esencial para el filtrado de perfiles por categoría
 */
async function createCategoryAttributeGroup() {
  try {
    console.log('🔗 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conexión establecida');

    // Verificar si ya existe el grupo
    const existingGroup = await AttributeGroupModel.findOne({ key: 'category' });
    
    if (existingGroup) {
      console.log('⚠️  El AttributeGroup "category" ya existe:');
      console.log(`   - ID: ${existingGroup._id}`);
      console.log(`   - Variantes: ${existingGroup.variants.length}`);
      console.log('   - Valores:');
      existingGroup.variants.forEach((v: any) => {
        console.log(`     • ${v.label} (${v.value}) - ${v.active ? 'Activo' : 'Inactivo'}`);
      });
      
      const answer = 'y'; // Auto-responder 'y' para scripts automatizados
      
      if (answer.toLowerCase() !== 'y') {
        console.log('❌ Operación cancelada');
        process.exit(0);
      }
      
      console.log('🔄 Actualizando grupo existente...');
      
      // Actualizar el grupo con las nuevas variantes
      existingGroup.variants = [
        {
          label: 'Escorts',
          value: 'escorts',
          active: true,
        },
        {
          label: 'Masajistas',
          value: 'masajistas',
          active: true,
        },
        {
          label: 'Modelos',
          value: 'modelos',
          active: true,
        },
        {
          label: 'Acompañantes',
          value: 'acompanantes',
          active: true,
        },
        {
          label: 'Damas de Compañía',
          value: 'damas-compania',
          active: true,
        },
      ];
      
      await existingGroup.save();
      console.log('✅ Grupo actualizado exitosamente');
    } else {
      console.log('📝 Creando AttributeGroup "category"...');
      
      const categoryGroup = await AttributeGroupModel.create({
        key: 'category',
        label: 'Categoría',
        type: 'single', // Solo se puede seleccionar una categoría
        required: true,
        variants: [
          {
            label: 'Escorts',
            value: 'escorts',
            active: true,
          },
          {
            label: 'Masajistas',
            value: 'masajistas',
            active: true,
          },
          {
            label: 'Modelos',
            value: 'modelos',
            active: true,
          },
          {
            label: 'Acompañantes',
            value: 'acompanantes',
            active: true,
          },
          {
            label: 'Damas de Compañía',
            value: 'damas-compania',
            active: true,
          },
        ],
      });

      console.log('✅ AttributeGroup "category" creado exitosamente');
      console.log(`   - ID: ${categoryGroup._id}`);
      console.log(`   - Key: ${categoryGroup.key}`);
      console.log(`   - Variantes: ${categoryGroup.variants.length}`);
      console.log('   - Categorías disponibles:');
      categoryGroup.variants.forEach((v: any) => {
        console.log(`     • ${v.label} (${v.value})`);
      });
    }

    console.log('\n📋 Resumen:');
    console.log('   El grupo "category" ahora está disponible para filtrado de perfiles');
    console.log('   Los perfiles deben tener una feature con group_id apuntando a este grupo');
    console.log('   y un value.key que coincida con alguna de las categorías (escorts, masajistas, etc.)');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar el script
createCategoryAttributeGroup()
  .then(() => {
    console.log('✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
