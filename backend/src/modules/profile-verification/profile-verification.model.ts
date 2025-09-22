import mongoose, { Schema } from 'mongoose';
import type { IProfileVerification } from '../profile/profile.types';

const ProfileVerificationSchema = new Schema<IProfileVerification>({
    profile: { type: Schema.Types.ObjectId, ref: 'Profile' },
    verificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending',
    },
    verificationProgress: { type: Number, required: true, default: 0 },
    accountType: {
        type: String,
        enum: ['common', 'agency'],
        default: 'common'
    },
    requiresIndependentVerification: {
        type: Boolean,
        default: false
    },
    steps: {
        documentPhotos: {
            frontPhoto: { type: String, default: undefined }, // Paso 1: Foto frontal del documento
            backPhoto: { type: String, default: undefined }, // Paso 2: Foto reverso del documento
            isVerified: { type: Boolean, default: false },
        },
        mediaVerification: {
            mediaLink: { type: String, default: undefined }, // Paso 3: Video o imagen de verificación
            mediaType: { type: String, enum: ['video', 'image'], default: undefined }, // Tipo de media
            isVerified: { type: Boolean, default: false },
        }, // Media verification (video or image).
        videoCallRequested: {
            videoLink: { type: String, default: undefined }, // required
            isVerified: { type: Boolean, default: false },
        }, // Meet with profile
        socialMedia: {
            isVerified: { type: Boolean, default: false },
        },
        phoneChangeDetected: {
            type: Boolean,
            default: false,
        },
        lastLogin: {
            isVerified: { type: Boolean, default: false },
            date: { type: Date, default: null },
        },
    },
    verifiedAt: { type: Date, default: undefined }, // Date when profile was verified.
    verificationFailedAt: { type: Date, default: undefined }, // Date when profile verification failed.
    verificationFailedReason: { type: String, default: undefined }, // Reason for verification failure.
});

export const ProfileVerification = mongoose.model<IProfileVerification>(
    'ProfileVerification',
    ProfileVerificationSchema,
);

export default ProfileVerification;
