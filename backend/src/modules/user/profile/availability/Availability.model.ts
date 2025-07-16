import mongoose, { type Document, Schema } from 'mongoose';

export interface IAvailability extends Document {
  profile: mongoose.Types.ObjectId;
  dayOfWeek:
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';
  slots: {
    start: string; // Ej: "13:00"
    end: string; // Ej: "17:00"
    timezone: string;
  }[];
}

const availabilitySchema = new Schema<IAvailability>({
  profile: { type: Schema.Types.ObjectId, ref: 'Profile' },
  dayOfWeek: { type: String, required: true },
  slots: [
    {
      start: String,
      end: String,
      timezone: String,
    },
  ],
});

export default mongoose.model<IAvailability>(
  'Availability',
  availabilitySchema,
);
