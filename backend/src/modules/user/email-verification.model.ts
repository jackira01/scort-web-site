import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailVerification extends Document {
  email: string;
  code: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}

const EmailVerificationSchema = new Schema<IEmailVerification>({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 15 * 60 * 1000), // 15 minutos
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5, // Máximo 5 intentos
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Índice para auto-eliminar documentos expirados
EmailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Índice único para email (solo un código activo por email)
EmailVerificationSchema.index({ email: 1 }, { unique: true });

export const EmailVerification = mongoose.model<IEmailVerification>('EmailVerification', EmailVerificationSchema);