import mongoose from 'mongoose';
import { ConfigParameterModel } from './src/modules/config-parameter/config-parameter.model';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/scort';

const createConfigParameter = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const key = 'profile.phone.stability.threshold.months';

        // Check if parameter already exists
        const existingParam = await ConfigParameterModel.findOne({ key });

        if (existingParam) {
            console.log(`Parameter '${key}' already exists. Updating...`);
            existingParam.value = 3;
            existingParam.isActive = true;
            await existingParam.save();
            console.log(`Parameter '${key}' updated successfully.`);
        } else {
            console.log(`Creating parameter '${key}'...`);

            // We need a valid user ID for modifiedBy. 
            // Since this is a script, we might need to find an admin user or use a placeholder if allowed by schema.
            // For now, let's try to find the first user in the DB to use as creator
            const UserModel = mongoose.model('User', new mongoose.Schema({}));
            const adminUser = await UserModel.findOne();

            const userId = adminUser ? adminUser._id : new mongoose.Types.ObjectId();

            await ConfigParameterModel.create({
                key,
                name: 'Umbral de Estabilidad de Teléfono (Meses)',
                description: 'Número de meses que deben transcurrir desde el último cambio de teléfono para considerar el perfil como estable',
                category: 'profile',
                type: 'number',
                value: 3,
                isActive: true,
                tags: ['verification', 'phone', 'stability'],
                modifiedBy: userId,
                lastModified: new Date()
            });
            console.log(`Parameter '${key}' created successfully.`);
        }

    } catch (error) {
        console.error('Error creating config parameter:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

createConfigParameter();
