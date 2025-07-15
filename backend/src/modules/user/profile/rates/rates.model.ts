import mongoose, { type Document, Schema } from 'mongoose';

export interface IRates extends Document {
    profile: mongoose.Types.ObjectId;
    title: number;
    price: string;
    duration: Date;
}

const ratesSchema = new Schema<IRates>({
    profile: { type: Schema.Types.ObjectId, ref: 'Profile' },
    title: { type: Number, required: true },
    price: { type: String, required: true },
    duration: { type: Date, required: true }
});

export default mongoose.model<IRates>('Rates', ratesSchema);