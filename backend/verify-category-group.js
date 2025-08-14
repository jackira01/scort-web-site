const mongoose = require('mongoose');
require('dotenv').config();

// Define the schemas directly in the script
const VariantSchema = new mongoose.Schema({
  value: { type: String, required: true },
  label: { type: String, required: true },
  active: { type: Boolean, default: true },
});

const AttributeGroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  key: { type: String, required: true, unique: true },
  variants: [VariantSchema],
}, { timestamps: true });

const AttributeGroup = mongoose.model('AttributeGroup', AttributeGroupSchema);

async function verifyCategoryGroup() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/scort-web-site';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check if category group exists
    const categoryGroup = await AttributeGroup.findOne({ key: 'category' });
    
    if (categoryGroup) {
      console.log('Category group already exists:', categoryGroup);
    } else {
      console.log('Category group not found. Creating it...');
      
      const newCategoryGroup = new AttributeGroup({
        name: 'Categoría',
        key: 'category',
        variants: [
          { value: 'escorts', label: 'Escorts', active: true },
          { value: 'masajes', label: 'Masajes', active: true },
          { value: 'trans', label: 'Trans', active: true },
          { value: 'maduras', label: 'Maduras', active: true },
          { value: 'vip', label: 'VIP', active: true },
          { value: 'independientes', label: 'Independientes', active: true },
        ],
      });
      
      await newCategoryGroup.save();
      console.log('Category group created successfully:', newCategoryGroup);
    }
    
    // List all attribute groups
    const allGroups = await AttributeGroup.find({});
    console.log('\nAll attribute groups:');
    allGroups.forEach(group => {
      console.log(`- ${group.name} (${group.key}): ${group.variants.length} variants`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

verifyCategoryGroup();