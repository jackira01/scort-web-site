import mongoose, { Schema } from 'mongoose';

export interface SystemConfig {
    userSettings: {
        maxGlobalProfiles: number;
    }
}

const systemConfigSchema = new Schema<SystemConfig>({
    userSettings: {
        maxGlobalProfiles: Number
    }
});

export default mongoose.model<SystemConfig>('SystemConfig', systemConfigSchema);