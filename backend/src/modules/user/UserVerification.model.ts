import mongoose, { type Document, Schema } from 'mongoose';

export interface IUserVerification extends Document {
  user: mongoose.Types.ObjectId;
    documentPhotos: string[];
    selfieWithDoc: string;
    isVerified: boolean;
    verifiedAt: Date;
}

const userVerificationSchema = new Schema<IUserVerification>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    documentPhotos: [String],
    selfieWithDoc: String,
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date, default: null }
});

export default mongoose.model<IUserVerification>('UserVerification', userVerificationSchema);