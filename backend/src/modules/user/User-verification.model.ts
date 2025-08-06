import mongoose, { type Document, Schema } from 'mongoose';

export interface IUserVerification extends Document {
  user: mongoose.Types.ObjectId;
  documentPhotos: {
    documents: string[];
    isVerified: boolean;
  };
  selfieWithDoc: {
    photo: string;
    isVerified: boolean;
  };
    isVerified: boolean;
    verifiedAt: Date;
}

const userVerificationSchema = new Schema<IUserVerification>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    documentPhotos: {
        documents: [String],
        isVerified: Boolean,
        default: false,
    },
    selfieWithDoc: {
        photo: String,
        isVerified: Boolean,
        default: false,
    },
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date, default: null }
});

export default mongoose.model<IUserVerification>('UserVerification', userVerificationSchema);