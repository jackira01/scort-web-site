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
    steps: {
        documentPhotos: {
            documents: { type: [String], default: [] }, // required
            isVerified: { type: Boolean, default: false },
        },
        selfieWithPoster: {
            photo: { type: String, default: undefined }, // required
            isVerified: { type: Boolean, default: false },
        }, // required
        selfieWithDoc: {
            photo: { type: String, default: undefined }, // required
            isVerified: { type: Boolean, default: false },
        }, // required
        fullBodyPhotos: {
            photos: { type: [String], default: [] }, // required
            isVerified: { type: Boolean, default: false },
        }, // required. at least 2 full body images. at least 2 face images. Face images verification. Full body images verification.
        video: {
            videoLink: { type: String, default: undefined }, // required
            isVerified: { type: Boolean, default: false },
        }, // required. Video verification.
        videoCallRequested: {
            videoLink: { type: String, default: undefined }, // required
            isVerified: { type: Boolean, default: false },
        }, // Meet with profile
        socialMedia: {
            accounts: { type: [String], default: [] }, // required. At least 1 social media account.
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
