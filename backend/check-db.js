const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

async function checkDatabase() {
    console.log('🔍 Verificando conexión a la base de datos...');
    console.log('🔍 MONGO_URI:', MONGO_URI ? 'Definida' : 'NO DEFINIDA');
    
    if (!MONGO_URI) {
        console.error('❌ MONGO_URI no está definida en las variables de entorno');
        return;
    }

    const client = new MongoClient(MONGO_URI);
    
    try {
        await client.connect();
        console.log('✅ Conexión exitosa a MongoDB');
        
        const db = client.db();
        console.log('🔍 Base de datos:', db.databaseName);
        
        // Verificar colecciones
        const collections = await db.listCollections().toArray();
        console.log('🔍 Colecciones encontradas:', collections.map(c => c.name));
        
        // Verificar AttributeGroups
        const attributeGroups = db.collection('attributegroups');
        const count = await attributeGroups.countDocuments();
        console.log('🔍 Total de AttributeGroups:', count);
        
        if (count > 0) {
            const groups = await attributeGroups.find({}).toArray();
            console.log('🔍 AttributeGroups encontrados:');
            groups.forEach(group => {
                console.log(`  - ${group.key}: ${group.name} (${group.variants?.length || 0} variants)`);
                if (group.variants && group.variants.length > 0) {
                    group.variants.forEach(variant => {
                        console.log(`    * ${variant.label || variant.value} (value: ${variant.value}, active: ${variant.active !== false})`);
                    });
                }
            });
        } else {
            console.log('⚠️  No se encontraron AttributeGroups en la base de datos');
        }
        
    } catch (error) {
        console.error('❌ Error conectando a la base de datos:', error.message);
    } finally {
        await client.close();
    }
}

checkDatabase().catch(console.error);