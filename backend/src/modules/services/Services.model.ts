import { model, Schema } from 'mongoose';

export interface IServices {
    name: string;
    isActive: boolean;
}

const ServicesSchema = new Schema<IServices>({
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

export default model('Services', ServicesSchema);
