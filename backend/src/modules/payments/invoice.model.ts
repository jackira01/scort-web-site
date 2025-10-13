import mongoose, { type Document, Schema } from 'mongoose';

export interface InvoiceItem {
  type: 'plan' | 'upgrade';
  code: string;
  name: string;
  days?: number;
  price: number;
  quantity: number;
}

export interface CouponInfo {
  code: string;
  name: string;
  type: 'percentage' | 'fixed_amount' | 'plan_assignment';
  value: number;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
}

export interface IInvoice extends Document {
  invoiceNumber: number;
  profileId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: 'pending' | 'paid' | 'cancelled' | 'expired';
  items: InvoiceItem[];
  totalAmount: number;
  coupon?: CouponInfo; // Información del cupón aplicado
  createdAt: Date;
  expiresAt: Date;
  paidAt?: Date;
  cancelledAt?: Date;
  paymentMethod?: string;
  paymentData?: any;
  cancellationReason?: string;
  notes?: string;
}

const invoiceItemSchema = new Schema<InvoiceItem>({
  type: {
    type: String,
    enum: ['plan', 'upgrade'],
    required: true
  },
  code: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  days: {
    type: Number
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  }
}, { _id: false });

const counterSchema = new Schema({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, default: 999 },
});

const Counter = mongoose.model("Counter", counterSchema);

const invoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: {
      type: Number,
      unique: true,
      index: true,
    },
    profileId: {
      type: Schema.Types.ObjectId,
      ref: 'Profile',
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'cancelled', 'expired'],
      default: 'pending',
      required: true
    },
    items: {
      type: [invoiceItemSchema],
      required: true,
      validate: {
        validator: function (items: InvoiceItem[]) {
          return items && items.length > 0;
        },
        message: 'Invoice must have at least one item'
      }
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    coupon: {
      code: { type: String },
      name: { type: String },
      type: {
        type: String,
        enum: ['percentage', 'fixed_amount', 'plan_assignment']
      },
      value: { type: Number },
      originalAmount: { type: Number },
      discountAmount: { type: Number },
      finalAmount: { type: Number },
      _id: false // Evitar que Mongoose genere automáticamente un _id para este subdocumento
    },
    expiresAt: {
      type: Date,
      required: true
    },
    paidAt: {
      type: Date
    },
    cancelledAt: {
      type: Date
    },
    paymentMethod: {
      type: String,
      maxlength: 100
    },
    paymentData: {
      type: Schema.Types.Mixed
    },
    cancellationReason: {
      type: String,
      maxlength: 500
    },
    notes: {
      type: String,
      maxlength: 500
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual para verificar si la factura está vencida
invoiceSchema.virtual('isExpired').get(function () {
  return this.status === 'pending' && new Date() > this.expiresAt;
});

// Índices para optimizar consultas
invoiceSchema.index({ profileId: 1, status: 1 });
invoiceSchema.index({ userId: 1, status: 1 });
invoiceSchema.index({ expiresAt: 1, status: 1 });
invoiceSchema.index({ createdAt: -1 });

// Middleware para actualizar totalAmount antes de guardar
invoiceSchema.pre('save', function (next) {
  // Solo recalcular totalAmount si no hay cupón aplicado
  // Si hay cupón, respetar el totalAmount que ya fue calculado con el descuento
  if (this.isModified('items') && !this.coupon) {
    this.totalAmount = this.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }
  next();
});

// 👇 middleware para asignar el número consecutivo
invoiceSchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await Counter.findOneAndUpdate(
      { name: "invoice" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    if (!counter) {
      return next(new Error("No se pudo generar el número de factura"));
    }

    this.invoiceNumber = counter.seq;
  }
  next();
});


export default mongoose.model<IInvoice>('Invoice', invoiceSchema);