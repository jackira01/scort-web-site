import mongoose, { type Document, Schema } from 'mongoose';

export interface IAvailability extends Document {
  day:
    | 'monday'
    | 'tuesday'
    | 'wednesday'
    | 'thursday'
    | 'friday'
    | 'saturday'
    | 'sunday';
  timeBlocks: {
    start: string; // Ej: "13:00"
    end: string; // Ej: "17:00"
    timezone: string;
  }[];
}

const availabilitySchema = new Schema<IAvailability>({
  day: { type: String, required: true },
  timeBlocks: [
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
