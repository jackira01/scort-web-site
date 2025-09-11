import { Schema, model, Document } from 'mongoose';

export interface INews extends Document {
  title: string;
  content: string[]; // Array de strings para los patch notes
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const newsSchema = new Schema<INews>(
  {
    title: {
      type: String,
      required: [true, 'El título es requerido'],
      trim: true,
      maxlength: [200, 'El título no puede exceder 200 caracteres']
    },
    content: {
      type: [String],
      required: [true, 'El contenido es requerido'],
      validate: {
        validator: function (v: string[]) {
          return v && v.length > 0;
        },
        message: 'Debe incluir al menos un elemento en el contenido'
      }
    },
    published: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Índices para optimizar consultas
newsSchema.index({ published: 1, createdAt: -1 });
newsSchema.index({ title: 'text' }); // Para búsqueda de texto

export const News = model<INews>('News', newsSchema);
export default News;