import mongoose, { Schema, Document, Model } from 'mongoose';
import type { ICoupon } from './coupon.types';

export interface ICouponDocument extends ICoupon, Document {}

export interface ICouponModel extends Model<ICouponDocument> {
  findByCode(code: string): Promise<ICouponDocument | null>;
  findValidCoupons(activeOnly?: boolean): Promise<ICouponDocument[]>;
  findByType(type: string, activeOnly?: boolean): Promise<ICouponDocument[]>;
}

const CouponSchema = new Schema<ICouponDocument>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      match: /^[A-Z0-9_-]+$/,
      maxlength: 50
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed_amount', 'plan_assignment'],
      required: true
    },
    value: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function(this: ICouponDocument, value: number) {
          if (this.type === 'percentage') {
            return value >= 0 && value <= 100;
          }
          if (this.type === 'fixed_amount') {
            return value >= 0;
          }
          // Para plan_assignment, el valor no es relevante
          return true;
        },
        message: 'El valor debe ser válido según el tipo de cupón'
      }
    },
    planCode: {
      type: String,
      uppercase: true,
      trim: true,
      validate: {
        validator: function(this: ICouponDocument, value: string) {
          // planCode es requerido solo para plan_assignment
          if (this.type === 'plan_assignment') {
            return !!value;
          }
          return true;
        },
        message: 'El código de plan es requerido para cupones de asignación de plan'
      }
    },
    variantDays: {
      type: Number,
      min: 1,
      validate: {
        validator: function(this: ICouponDocument, value: number) {
          // variantDays es requerido solo para plan_assignment
          if (this.type === 'plan_assignment') {
            return !!value && value > 0;
          }
          return true;
        },
        message: 'Los días de variante son requeridos para cupones de asignación de plan'
      }
    },
    applicablePlans: {
      type: [String],
      default: [],
      validate: {
        validator: function(plans: string[]) {
          // Validar que todos los códigos sean válidos
          return plans.every(plan => /^[A-Z0-9_-]+$/.test(plan));
        },
        message: 'Los códigos de planes deben ser válidos'
      }
    },
    validPlanIds: {
      type: [String],
      default: [],
      validate: {
        validator: function(this: ICouponDocument, planIds: string[]) {
          // Solo requerido para cupones percentage y fixed_amount
          if (this.type === 'percentage' || this.type === 'fixed_amount') {
            return planIds && planIds.length > 0;
          }
          return true;
        },
        message: 'Los IDs de planes válidos son requeridos para cupones porcentuales y de monto fijo'
      }
    },
    validUpgradeIds: {
      type: [String],
      default: [],
      validate: {
        validator: function(upgradeIds: string[]) {
          // Validar que todos los IDs sean válidos
          return upgradeIds.every(id => /^[A-Z0-9_-]+$/.test(id));
        },
        message: 'Los IDs de upgrades deben ser válidos'
      }
    },
    maxUses: {
      type: Number,
      required: true,
      min: -1, // -1 para ilimitado
      validate: {
        validator: function(value: number) {
          return value === -1 || value > 0;
        },
        message: 'Los usos máximos deben ser -1 (ilimitado) o mayor a 0'
      }
    },
    currentUses: {
      type: Number,
      default: 0,
      min: 0
    },
    validFrom: {
      type: Date,
      required: true
    },
    validUntil: {
      type: Date,
      required: true,
      validate: {
        validator: function(this: ICouponDocument, value: Date) {
          return value > this.validFrom;
        },
        message: 'La fecha de vencimiento debe ser posterior a la fecha de inicio'
      }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual para verificar si el cupón está vigente
CouponSchema.virtual('isValid').get(function() {
  const doc = this as any;
  const now = new Date();
  return doc.isActive && 
         now >= doc.validFrom && 
         now <= doc.validUntil &&
         (doc.maxUses === -1 || doc.currentUses < doc.maxUses);
});

// Virtual para verificar si el cupón está agotado
CouponSchema.virtual('isExhausted').get(function() {
  const doc = this as any;
  return doc.maxUses !== -1 && doc.currentUses >= doc.maxUses;
});

// Virtual para obtener usos restantes
CouponSchema.virtual('remainingUses').get(function() {
  const doc = this as any;
  if (doc.maxUses === -1) return -1; // Ilimitado
  return Math.max(0, doc.maxUses - doc.currentUses);
});

// Índices para optimizar consultas
CouponSchema.index({ code: 1 }); // Ya único, pero explícito
CouponSchema.index({ type: 1, isActive: 1 });
CouponSchema.index({ validFrom: 1, validUntil: 1 });
CouponSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });
CouponSchema.index({ createdBy: 1 });
CouponSchema.index({ createdAt: -1 });

// Métodos estáticos
CouponSchema.statics.findByCode = function(code: string) {
  return this.findOne({ code: code.toUpperCase() });
};

CouponSchema.statics.findValidCoupons = function(activeOnly: boolean = true) {
  const now = new Date();
  const query: any = {
    validFrom: { $lte: now },
    validUntil: { $gte: now }
  };
  
  if (activeOnly) {
    query.isActive = true;
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

CouponSchema.statics.findByType = function(type: string, activeOnly: boolean = true) {
  const query: any = { type };
  if (activeOnly) {
    query.isActive = true;
  }
  return this.find(query).sort({ createdAt: -1 });
};

// Middleware para validar antes de guardar
CouponSchema.pre('save', function(next) {
  const doc = this as any;
  
  // Convertir código a mayúsculas
  if (doc.code) {
    doc.code = doc.code.toUpperCase();
  }
  
  // Convertir planCode a mayúsculas si existe
  if (doc.planCode) {
    doc.planCode = doc.planCode.toUpperCase();
  }
  
  // Convertir applicablePlans a mayúsculas
  if (doc.applicablePlans && Array.isArray(doc.applicablePlans) && doc.applicablePlans.length > 0) {
    doc.applicablePlans = doc.applicablePlans.map((plan: any) => 
      typeof plan === 'string' ? plan.toUpperCase() : plan
    );
  }
  
  next();
});

export const CouponModel = mongoose.model<ICouponDocument, ICouponModel>('Coupon', CouponSchema);
export default CouponModel;