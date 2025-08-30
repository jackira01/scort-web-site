import mongoose, { Schema } from 'mongoose';
import type { IProfile } from './profile.types';

const profileSchema = new Schema<IProfile>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: String,
    isActive: { type: Boolean, default: false },
    location: {
      country: {
        value: { type: String, required: true }, // Valor normalizado
        label: { type: String, required: true }, // Valor para mostrar
      },
      department: {
        value: { type: String, required: true }, // Valor normalizado
        label: { type: String, required: true }, // Valor para mostrar
      },
      city: {
        value: { type: String, required: true }, // Valor normalizado
        label: { type: String, required: true }, // Valor para mostrar
      },
    },
    features: [
      {
        group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AttributeGroup', required: true }, // nombre del grupo (ej: 'gender', 'hairColor', etc.)
        value: [{ type: String, required: true }], // string o string[] // valor seleccionado (ej: 'Hombre', 'Rubio', etc.)
      },
    ],
    age: { type: String, required: true, },
    contact: {
      number: { type: String, required: true, },
      whatsapp: { type: String, required: false },
      telegram: { type: String, required: false },
      changedAt: Date,
    },
    height: { type: String, required: true },
    media: {
      gallery: [String],
      videos: [String],
      audios: [String],
      stories: [{
        link: String,
        type: {
          type: String,
          enum: ['image', 'video'],
          required: true,
        },
      }],
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
    lastLogin: Date,

    // Nuevos campos para motor de visibilidad
    planAssignment: {
      type: {
        planCode: { type: String },           // ref lógico a PlanDefinition.code
        variantDays: { type: Number },        // 7|15|30|180...
        startAt: { type: Date },
        expiresAt: { type: Date },
      },
      default: null
    },
    upgrades: [{
      code: { type: String, required: true },               // ref a UpgradeDefinition.code
      startAt: { type: Date, required: true },
      endAt: { type: Date, required: true },
      purchaseAt: { type: Date, required: true },
    }],
    lastShownAt: { type: Date },           // para rotación
    visible: { type: Boolean, default: true },             // default true mientras no expire plan
  },
  { timestamps: true },
);

// Índices para motor de visibilidad
profileSchema.index({ visible: 1 });
profileSchema.index({ 'planAssignment.expiresAt': 1 });
profileSchema.index({ lastShownAt: 1 });
profileSchema.index({ visible: 1, 'planAssignment.expiresAt': 1, lastShownAt: 1 }); // Índice compuesto

export const ProfileModel = mongoose.model<IProfile>('Profile', profileSchema);