const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

const sampleAttributeGroups = [
    {
        name: 'Categoría',
        key: 'category',
        variants: [
            { label: 'Escort', value: 'escort', active: true },
            { label: 'Masajista', value: 'masajista', active: true },
            { label: 'Modelo', value: 'modelo', active: true },
            { label: 'Acompañante', value: 'acompañante', active: true }
        ]
    },
    {
        name: 'Género',
        key: 'gender',
        variants: [
            { label: 'Femenino', value: 'femenino', active: true },
            { label: 'Masculino', value: 'masculino', active: true },
            { label: 'Trans', value: 'trans', active: true }
        ]
    },
    {
        name: 'Orientación Sexual',
        key: 'sex',
        variants: [
            { label: 'Heterosexual', value: 'heterosexual', active: true },
            { label: 'Bisexual', value: 'bisexual', active: true },
            { label: 'Homosexual', value: 'homosexual', active: true }
        ]
    }
];

async function seedAttributeGroups() {
    console.log('🌱 Iniciando seed de AttributeGroups...');
    
    if (!MONGO_URI) {
        console.error('❌ MONGO_URI no está definida en las variables de entorno');
        return;
    }

    const client = new MongoClient(MONGO_URI);
    
    try {
        await client.connect();
        console.log('✅ Conexión exitosa a MongoDB');
        
        const db = client.db();
        const attributeGroups = db.collection('attributegroups');
        
        // Verificar si ya existen datos
        const existingCount = await attributeGroups.countDocuments();
        console.log('🔍 AttributeGroups existentes:', existingCount);
        
        if (existingCount === 0) {
            console.log('🌱 Insertando datos de prueba...');
            
            for (const group of sampleAttributeGroups) {
                const result = await attributeGroups.insertOne({
                    ...group,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                console.log(`✅ Insertado: ${group.name} (${group.key}) - ID: ${result.insertedId}`);
            }
            
            console.log('🎉 Seed completado exitosamente');
        } else {
            console.log('ℹ️  Ya existen AttributeGroups, no se insertarán datos de prueba');
            
            // Mostrar los existentes
            const existing = await attributeGroups.find({}).toArray();
            console.log('🔍 AttributeGroups existentes:');
            existing.forEach(group => {
                console.log(`  - ${group.key}: ${group.name} (${group.variants?.length || 0} variants)`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error en seed:', error.message);
    } finally {
        await client.close();
    }
}

seedAttributeGroups().catch(console.error);