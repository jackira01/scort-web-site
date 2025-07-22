import { model, Schema } from 'mongoose';

export interface Category {
    name: string;
    description: string;
    image: string;
    countProfiles: number;
}

const CategorySchema = new Schema<Category>({
    name: { type: String, required: true, unique: true },
    description: String,
    image: String,
    countProfiles: { type: Number, default: 0 },
});

export default model('Category', CategorySchema);
