import { Schema, model, Document } from 'mongoose';

export interface IBlog extends Document {
  title: string;
  slug: string;
  content: object; // JSON del Rich Text Editor
  coverImage?: string; // URL de la imagen principal
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const blogSchema = new Schema<IBlog>(
  {
    title: {
      type: String,
      required: [true, 'El título es requerido'],
      trim: true,
      maxlength: [200, 'El título no puede exceder 200 caracteres']
    },
    slug: {
      type: String,
      required: [true, 'El slug es requerido'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones']
    },
    content: {
      type: Schema.Types.Mixed,
      required: [true, 'El contenido es requerido']
    },
    coverImage: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          if (!v) return true; // Campo opcional
          return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
        },
        message: 'La imagen de portada debe ser una URL válida de imagen'
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
// Nota: El índice para 'slug' se crea automáticamente por unique: true
blogSchema.index({ published: 1, createdAt: -1 });
blogSchema.index({ title: 'text', content: 'text' }); // Para búsqueda de texto

// Middleware pre-save para generar slug automáticamente si no existe
blogSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
      .replace(/\s+/g, '-') // Reemplazar espacios con guiones
      .replace(/-+/g, '-') // Remover guiones duplicados
      .trim();
  }
  next();
});

export const Blog = model<IBlog>('Blog', blogSchema);
export default Blog;