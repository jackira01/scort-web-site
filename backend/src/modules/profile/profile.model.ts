import mongoose, { Schema } from 'mongoose';
import type { IProfile } from './profile.types';

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
    features: [
      {
        group: { type: mongoose.Schema.Types.ObjectId, ref: 'AttributeGroup', required: true }, // nombre del grupo (ej: 'gender', 'hairColor', etc.)
        value: { type: String, required: true }, // valor seleccionado (ej: 'Hombre', 'Rubio', etc.)
      },
    ],
    media: {
      gallery: [String],
      videos: [String],
      stories: [String],
    },
    verification: { type: Schema.Types.ObjectId, ref: 'ProfileVerification' },
    availability: [{ type: Schema.Types.ObjectId, ref: 'Availability' }],
    rates: [{ type: Schema.Types.ObjectId, ref: 'Rate' }],
    paymentHistory: [{ type: Schema.Types.ObjectId, ref: 'PaymentHistory' }],
    plan: { type: Schema.Types.ObjectId, ref: 'Plan' },
    upgrades: [{ type: Schema.Types.ObjectId, ref: 'Upgrade' }],
  },
  { timestamps: true },
);

export const ProfileModel = mongoose.model<IProfile>('Profile', profileSchema);