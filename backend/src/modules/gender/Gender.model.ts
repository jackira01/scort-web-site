import { model, Schema } from 'mongoose';

export interface IGender {
    name: string;
    isActive: boolean;
}

const GenderSchema = new Schema<IGender>({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
});

export default model('Gender', GenderSchema);
