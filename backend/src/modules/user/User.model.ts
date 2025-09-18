import type { PaginateModel } from 'mongoose'; // importante
import mongoose, { type Document, Schema } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
export interface IUser {
  email: string;
  name: string;
  verificationDocument?: string[];
  password?: string; // Optional, as not all users may have a password
  isVerified: boolean;
  verification_in_progress?: boolean;
  profiles: mongoose.Types.ObjectId[];
  role: 'admin' | 'user' | 'guest';
  accountType: 'common' | 'agency';
  providers: string[]; // Array of authentication providers ['google', 'credentials']
  hasPassword: boolean; // Indicates if user has set a password
  emailVerified?: Date; // When email was verified
  image?: string; // Profile image URL
  agencyInfo?: {
    businessName?: string;
    businessDocument?: string;
    conversionRequestedAt?: Date;
    conversionApprovedAt?: Date;
    conversionApprovedBy?: mongoose.Types.ObjectId;
    conversionStatus: 'pending' | 'approved' | 'rejected';
    reason?: string;
    rejectionReason?: string;
  };
  lastLogin: {
    isVerified: boolean;
    date: Date;
  };
  resetPasswordCode?: string; // Código de recuperación de contraseña
  resetPasswordExpires?: Date; // Fecha de expiración del código
  resetPasswordToken?: string; // Token temporal para cambio de contraseña
  resetPasswordTokenExpires?: Date; // Fecha de expiración del token
}

export interface IUserDocument extends IUser, Document { }

const userSchema = new Schema<IUserDocument>({
  email: { type: String, required: true, unique: true },
  name: String,
  verificationDocument: [String],
  password: { type: String }, // Hashed password for credentials login
  isVerified: { type: Boolean, default: false },
  verification_in_progress: { type: Boolean, default: false },
  profiles: [{ type: Schema.Types.ObjectId, ref: 'Profile' }],
  role: { type: String, enum: ['admin', 'user', 'guest'], default: 'user' },
  accountType: { type: String, enum: ['common', 'agency'], default: 'common' },
  providers: { type: [String], default: [] }, // Authentication providers
  hasPassword: { type: Boolean, default: false }, // Whether user has set a password
  emailVerified: { type: Date }, // Email verification timestamp
  image: { type: String }, // Profile image URL
  agencyInfo: {
    businessName: { type: String },
    businessDocument: { type: String },
    conversionRequestedAt: { type: Date },
    conversionApprovedAt: { type: Date },
    conversionApprovedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    conversionStatus: { type: String, enum: ['pending', 'approved', 'rejected'] },
    reason: { type: String },
    rejectionReason: { type: String },
  },
  lastLogin: {
    isVerified: { type: Boolean, default: false },
    date: { type: Date, default: null },
  },
  resetPasswordCode: { type: String }, // Código de recuperación de contraseña
  resetPasswordExpires: { type: Date }, // Fecha de expiración del código
  resetPasswordToken: { type: String }, // Token temporal para cambio de contraseña
  resetPasswordTokenExpires: { type: Date }, // Fecha de expiración del token

});

// Índices optimizados
// Nota: El índice para 'email' se crea automáticamente por unique: true
userSchema.index({ isVerified: 1 }); // Para filtros de verificación
userSchema.index({ role: 1 }); // Para filtros por rol
userSchema.index({ accountType: 1 }); // Para filtros por tipo de cuenta
userSchema.index({ 'lastLogin.date': -1 }); // Para ordenar por último login

userSchema.plugin(mongoosePaginate);

const UserModel = mongoose.model<IUserDocument, PaginateModel<IUserDocument>>('User', userSchema);

export default UserModel;
