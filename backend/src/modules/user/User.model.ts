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
}

export interface IUserDocument extends IUser, Document { }

const userSchema = new Schema<IUserDocument>({
  email: { type: String, required: true, unique: true },
  name: String,
  verificationDocument: [String],
  isVerified: { type: Boolean, default: false },
  verification_in_progress: { type: Boolean, default: false },
  profiles: [{ type: Schema.Types.ObjectId, ref: 'Profile' }],
  role: { type: String, enum: ['admin', 'user', 'guest'], default: 'user' },
  accountType: { type: String, enum: ['common', 'agency'], default: 'common' },
  agencyInfo: {
    businessName: { type: String },
    businessDocument: { type: String },
    conversionRequestedAt: { type: Date },
    conversionApprovedAt: { type: Date },
    conversionApprovedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    conversionStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reason: { type: String },
    rejectionReason: { type: String },
  },
  lastLogin: {
    isVerified: { type: Boolean, default: false },
    date: { type: Date, default: null },
  },

});

userSchema.plugin(mongoosePaginate);

const UserModel = mongoose.model<IUserDocument, PaginateModel<IUserDocument>>('User', userSchema);

export default UserModel;
