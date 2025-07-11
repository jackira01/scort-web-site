import mongoose, { type Document, Schema } from 'mongoose';

export interface IPaymentHistory extends Document {
  profile: mongoose.Types.ObjectId;
  plan: string;
  amount: number;
  startDate: Date;
  endDate: Date;
  upgrades: string[]; // DESTACADO, IMPULSO
}

const paymentHistorySchema = new Schema<IPaymentHistory>(
  {
    profile: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
    plan: { type: String, required: true },
    amount: Number,
    startDate: Date,
    endDate: Date,
    upgrades: [String],
  },
  { timestamps: true },
);

export default mongoose.model<IPaymentHistory>(
  'PaymentHistory',
  paymentHistorySchema,
);
