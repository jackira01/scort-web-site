import mongoose, { type Document, Schema } from 'mongoose';
import type { IAvailability } from './availability/Availability.model';
export interface IProfile extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  description: string;
  location: {
    country: string;
    department: string;
    municipality: string;
  };
  features: {
    age: number;
    sex: string;
    gender: string;
    eyes: string;
    height: number;
    bodyType: string;
    hairColor: string;
  };
  media: {
    gallery: string[];
    videos: string[];
    stories: string[];
  };
  availability: IAvailability[];
  verification: mongoose.Types.ObjectId;
  rates: mongoose.Types.ObjectId[];
  services: mongoose.Types.ObjectId[];
  plan: mongoose.Types.ObjectId;
  upgrades: mongoose.Types.ObjectId[];
  paymentHistory: mongoose.Types.ObjectId[];
}

const profileSchema = new Schema<IProfile>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, unique: true },
    description: String,
    location: {
      country: String,
      state: String,
      city: String,
    },
    features: {
      bodyType: String,
      hairColor: String,
      sex: String,
      gender: String,
      age: Number,
      eyes: String,
      height: Number,
    },
    media: {
      gallery: [String],
      videos: [String],
      stories: [String],
    },
    verification: { type: Schema.Types.ObjectId, ref: 'ProfileVerification' },
    availability: [{ type: Schema.Types.ObjectId, ref: 'Availability' }],
    rates: [{ type: Schema.Types.ObjectId, ref: 'Rate' }],
    services: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
    paymentHistory: [{ type: Schema.Types.ObjectId, ref: 'PaymentHistory' }],
    plan: { type: Schema.Types.ObjectId, ref: 'Plan' },
    upgrades: [{ type: Schema.Types.ObjectId, ref: 'Upgrade' }]

  },
  { timestamps: true },
);

export default mongoose.model<IProfile>('Profile', profileSchema);
