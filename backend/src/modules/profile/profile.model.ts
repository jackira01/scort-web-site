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
        value: [{ type: String, required: true }], // string o string[] // valor seleccionado (ej: 'Hombre', 'Rubio', etc.)
      },
    ],
    age: { type: String, required: true, },
    phoneNumber: {
      phoneNumber: { type: String, required: true, },
      whatsapp: { type: Boolean, required: true, default: false },
      telegram: { type: Boolean, required: true, default: false },
    },
    height: { type: String, required: true, },
    media: {
      gallery: [String],
      videos: [String],
      stories: [String],
    },
    verification: { type: Schema.Types.ObjectId, ref: 'ProfileVerification' },
    availability: [
      {
        dayOfWeek: {
          type: String,
          enum: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sábado', 'domingo'],
          required: true,
        },
        slots: [
          {
            start: { type: String, required: true },
            end: { type: String, required: true },
            timezone: { type: String, required: true },
          },
        ],
      },
    ],
    rates: [
      {
        hour: { type: String, required: true }, // Ej: "01:00", "00:30"
        price: { type: Number, required: true },
        delivery: { type: Boolean, required: true, default: false },

      },
    ],
    paymentHistory: [{ type: Schema.Types.ObjectId, ref: 'PaymentHistory' }],
    plan: { type: Schema.Types.ObjectId, ref: 'Plan' },
    upgrades: [{ type: Schema.Types.ObjectId, ref: 'Upgrade' }],
  },
  { timestamps: true },
);

export const ProfileModel = mongoose.model<IProfile>('Profile', profileSchema);