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
      number: { type: String, required: false },
      whatsapp: { type: String, required: false },
      telegram: { type: String, required: false },
      changedAt: Date,
    },
    height: { type: String, required: true },
    // Nuevos campos para clasificación de servicios
    basicServices: [{ type: String }],
    additionalServices: [{ type: String }],
    socialMedia: {
      instagram: { type: String, required: false },
      facebook: { type: String, required: false },
      tiktok: { type: String, required: false },
      twitter: { type: String, required: false },
      onlyFans: { type: String, required: false },
    },
    media: {
      gallery: [String],
      videos: [{
        link: String,
        preview: String, // URL de la imagen de preview del video
      }],
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
    paymentHistory: [{ type: Schema.Types.ObjectId, ref: 'Invoice' }],
    lastLogin: Date,

    // Nuevos campos para motor de visibilidad
    planAssignment: {
      type: {
        planId: { type: Schema.Types.ObjectId, ref: 'PlanDefinition' }, // ref directo a PlanDefinition._id
        planCode: { type: String },           // DEPRECATED: mantener para compatibilidad durante migración
        variantDays: { type: Number },        // 7|15|30|180...
        startAt: { type: Date },
        expiresAt: { type: Date },
      },
      default: null,
      _id: false  // Evitar que Mongoose genere automáticamente un _id para este subdocumento
    },
    upgrades: [{
      code: { type: String, required: true },               // ref a UpgradeDefinition.code
      startAt: { type: Date, required: true },
      endAt: { type: Date, required: true },
      purchaseAt: { type: Date, required: true },
    }],
    lastShownAt: { type: Date },           // para rotación
    visible: { type: Boolean, default: true },             // default true mientras no expire plan
    isDeleted: { type: Boolean, default: false },          // borrado lógico - true significa eliminado
  },
  { timestamps: true },
);

// Índices para motor de visibilidad
profileSchema.index({ visible: 1 });
profileSchema.index({ isDeleted: 1 });
profileSchema.index({ 'planAssignment.expiresAt': 1 });
profileSchema.index({ lastShownAt: 1 });
profileSchema.index({ visible: 1, 'planAssignment.expiresAt': 1, lastShownAt: 1 }); // Índice compuesto
profileSchema.index({ isDeleted: 1, visible: 1 }); // Índice compuesto para borrado lógico

// Índices optimizados para filtros
profileSchema.index({ user: 1 }); // Para lookup con users
profileSchema.index({ 'location.country.value': 1 });
profileSchema.index({ 'location.department.value': 1 });
profileSchema.index({ 'location.city.value': 1 });
profileSchema.index({ 'features.group_id': 1, 'features.value': 1 }); // Para filtros de características
profileSchema.index({ 'rates.price': 1 }); // Para filtros de precio
profileSchema.index({ 'media.videos': 1 }); // Para filtro hasVideos
profileSchema.index({ 'upgrades.code': 1, 'upgrades.startAt': 1, 'upgrades.endAt': 1 }); // Para upgrades activos
profileSchema.index({ 'planAssignment.planCode': 1 }); // Para filtros por plan

// Índice compuesto para consultas frecuentes de filtros
profileSchema.index({ 
  visible: 1, 
  isDeleted: 1, 
  'planAssignment.expiresAt': 1,
  'location.country.value': 1 
});

// Índice para ordenamiento por createdAt
profileSchema.index({ createdAt: -1 });

export const ProfileModel = mongoose.model<IProfile>('Profile', profileSchema);