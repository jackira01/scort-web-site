import mongoose, { Schema } from 'mongoose';
import type { IProfileVerification } from '../profile/profile.types';

const ProfileVerificationSchema = new Schema<IProfileVerification>({
    profile: { type: Schema.Types.ObjectId, ref: 'Profile' },
    verificationStatus: {
        type: String,
        enum: ['pending', 'check'],
        default: 'check',
    },
    verificationProgress: { type: Number, required: true, default: 0 },
    requiresIndependentVerification: {
        type: Boolean,
        default: false
    },
    steps: {
        frontPhotoVerification: {
            photo: { type: String, default: undefined }, // Foto frontal del documento de identidad
            isVerified: { type: Boolean, default: false },
        },
        selfieVerification: {
            photo: { type: String, default: undefined }, // Foto con documento al lado del rostro
            isVerified: { type: Boolean, default: false },
        },
        mediaVerification: {
            mediaLink: { type: String, default: undefined }, // Paso 2: Video o foto de verificación con cartel
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
        // Campos computados dinámicamente (no se guardan en DB, solo se inyectan en respuesta)
        accountAge: {
            isVerified: { type: Boolean, default: false },
            status: { type: String, enum: ['verified', 'pending'], default: 'pending' }
        },
        contactConsistency: {
            isVerified: { type: Boolean, default: false },
            status: { type: String, enum: ['verified', 'pending'], default: 'pending' },
            debug: {
                hasChanged: { type: Boolean, default: undefined },
                lastChangeDate: { type: Date, default: undefined },
                hasContactNumber: { type: Boolean, default: undefined },
                calculatedAt: { type: String, default: undefined }
            }
        }
    },
    verifiedAt: { type: Date, default: undefined }, // Date when profile was verified.
    verificationFailedAt: { type: Date, default: undefined }, // Date when profile verification failed.
    verificationFailedReason: { type: String, default: undefined }, // Reason for verification failure.
});

// Índices para optimización del Cron Job de verificación
ProfileVerificationSchema.index({ verificationProgress: 1 });
ProfileVerificationSchema.index({ profile: 1 });

export const ProfileVerification = mongoose.model<IProfileVerification>(
    'ProfileVerification',
    ProfileVerificationSchema,
);

export default ProfileVerification;
