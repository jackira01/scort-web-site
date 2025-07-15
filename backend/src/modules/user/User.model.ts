import mongoose, { type Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  password?: string; // Optional, as not all users may have a password
  isVerified: boolean;
  verification: mongoose.Types.ObjectId;
  profiles: mongoose.Types.ObjectId[];
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false }, // Password may not be required for all users
  name: { type: String, required: true },
  verification: { type: Schema.Types.ObjectId, ref: 'UserVerification' },
  profiles: [{ type: Schema.Types.ObjectId, ref: 'Profile' }],
});

export default mongoose.model<IUser>('User', userSchema);
