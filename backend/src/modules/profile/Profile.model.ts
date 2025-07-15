import mongoose, { type Document, Schema } from 'mongoose';
import type { IAvailability } from '../availability/Availability.model';
export interface IProfile extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  description: string;
  location: {
    country: string;
    state: string;
    city: string;
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
  rates: {
    title: string;
    price: number;
    duration: string;
  }[];
  paymentHistory: mongoose.Types.ObjectId[];
}

const profileSchema = new Schema<IProfile>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
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
    availability: [{ type: Schema.Types.ObjectId, ref: 'Availability' }],
    rates: [
      {
        title: String,
        price: Number,
        duration: String,
      },
    ],
    paymentHistory: [{ type: Schema.Types.ObjectId, ref: 'PaymentHistory' }],
  },
  { timestamps: true },
);

export default mongoose.model<IProfile>('Profile', profileSchema);
