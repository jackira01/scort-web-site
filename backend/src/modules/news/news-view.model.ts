import { Schema, model, Document, Types } from 'mongoose';

export interface INewsView extends Document {
  user: Types.ObjectId;
  news: Types.ObjectId;
  viewedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const newsViewSchema = new Schema<INewsView>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El usuario es requerido']
    },
    news: {
      type: Schema.Types.ObjectId,
      ref: 'News',
      required: [true, 'La noticia es requerida']
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Índice compuesto para evitar duplicados y optimizar consultas
newsViewSchema.index({ user: 1, news: 1 }, { unique: true });
newsViewSchema.index({ user: 1, viewedAt: -1 });
newsViewSchema.index({ news: 1, viewedAt: -1 });

export const NewsView = model<INewsView>('NewsView', newsViewSchema);
export default NewsView;