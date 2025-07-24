import mongoose, { Schema } from 'mongoose';
import type { IProfileVerification } from './profile.types';

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
    verifiedAt: Date,
});

export default mongoose.model<IProfileVerification>(
    'User',
    ProfileVerificationSchema,
);
