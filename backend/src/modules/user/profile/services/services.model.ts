import mongoose, { type Document, Schema } from 'mongoose';

export interface Iservices extends Document {
    profile: mongoose.Types.ObjectId;
    name: string;
    description?: string;
}

const servicesSchema = new Schema<Iservices>({
    profile: { type: Schema.Types.ObjectId, ref: 'Profile' },
    name: { type: String, required: true },
    description: { type: String }
})

export default mongoose.model<Iservices>('Services', servicesSchema);