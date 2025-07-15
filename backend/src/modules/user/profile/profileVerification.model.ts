import mongoose, { type Document, Schema } from 'mongoose';

export interface IProfileVerification extends Document {
    profile: mongoose.Types.ObjectId;
    documentPhotos: string[]; // required
    selfieWithDoc: string; // required
    facePhotos: string[]; // required
    fullBodyPhotos: string[];
    verificationVideo: string;
    videoCallRequested: boolean;
    lastSeen: Date;
    phoneChangeDetected: boolean;
    isVerified: boolean;
    verifiedAt: Date;
}

const ProfileVerificationSchema = new Schema<IProfileVerification>({
    profile: { type: Schema.Types.ObjectId, ref: 'Profile' },
    documentPhotos: [String], // required
    selfieWithDoc: String, // required
    facePhotos: [String],
    fullBodyPhotos: [String],
    verificationVideo: String,
    videoCallRequested: Boolean,
    lastSeen: Date,
    phoneChangeDetected: Boolean,
    isVerified: Boolean,
    verifiedAt: Date
});

export default mongoose.model<IProfileVerification>('User', ProfileVerificationSchema);
