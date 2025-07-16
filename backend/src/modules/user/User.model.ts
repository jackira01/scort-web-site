import mongoose, { type Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name?: string;
  isVerified: boolean;
  verification_in_progress?: boolean;
  profiles: mongoose.Types.ObjectId[];
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  name: String,
  isVerified: { type: Boolean, default: false },
  verification_in_progress: { type: Boolean, default: false },
  profiles: [{ type: Schema.Types.ObjectId, ref: 'Profile' }],
});

export default mongoose.model<IUser>('User', userSchema);
