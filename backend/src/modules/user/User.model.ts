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
}
export interface IUserDocument extends IUser, Document { }

const userSchema = new Schema<IUserDocument>({
  email: { type: String, required: true, unique: true },
  name: String,
  verificationDocument: [String],
  isVerified: { type: Boolean, default: false },
  verification_in_progress: { type: Boolean, default: false },
  profiles: [{ type: Schema.Types.ObjectId, ref: 'Profile' }],
});

userSchema.plugin(mongoosePaginate);

const UserModel = mongoose.model<IUserDocument, PaginateModel<IUserDocument>>('User', userSchema);

export default UserModel;
