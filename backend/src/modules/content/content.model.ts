import mongoose, { Schema, Document, Model } from 'mongoose';
import { IContentPage, IContentSection, IContentBlock, ContentBlockType } from './content.types';

// Interfaces para los métodos estáticos y de instancia
interface IContentPageDocument extends IContentPage, Document {
  validateStructure(): boolean;
}

interface IContentPageModel extends Model<IContentPageDocument> {
  findBySlug(slug: string): Promise<IContentPageDocument | null>;
}

/**
 * Schema para bloques de contenido
 */
const ContentBlockSchema = new Schema<IContentBlock>({
  type: {
    type: String,
    enum: Object.values(ContentBlockType),
    required: true
  },
  value: {
    type: Schema.Types.Mixed, // Permite string, array de strings, o array de objetos FAQ
    required: true,
    validate: {
      validator: function (value: any) {
        // Para listas debe ser array de strings
        if (this.type === ContentBlockType.LIST) {
          return Array.isArray(value) && value.length > 0 &&
            value.every((item: any) => typeof item === 'string');
        }
        // Para FAQ debe ser array de objetos con question y answer
        if (this.type === ContentBlockType.FAQ) {
          return Array.isArray(value) && value.length > 0 &&
            value.every((item: any) =>
              typeof item === 'object' &&
              typeof item.question === 'string' &&
              typeof item.answer === 'string'
            );
        }
        // Para otros tipos debe ser string
        return typeof value === 'string' && value.trim().length > 0;
      },
      message: 'El valor debe ser un string no vacío para párrafos/imágenes/links, un array de strings para listas, o un array de objetos {question, answer} para FAQ'
    }
  },
  order: {
    type: Number,
    default: 0
  }
}, { _id: false });

/**
 * Schema para secciones de contenido
 */
const ContentSectionSchema = new Schema<IContentSection>({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 200
  },
  order: {
    type: Number,
    required: true,
    min: 0
  },
  blocks: {
    type: [ContentBlockSchema],
    default: []
  }
}, { _id: false });

/**
 * Schema para una página de contenido completa
 */
const ContentPageSchema = new Schema<IContentPageDocument>({
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[a-z0-9-_\/]+$/, // Permitir rutas anidadas con /
    minlength: 2,
    maxlength: 100
  },
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 200
  },
  sections: {
    type: [ContentSectionSchema],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  },
  modifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  collection: 'contentpages'
});

// Índices para optimizar consultas
ContentPageSchema.index({ slug: 1 });
ContentPageSchema.index({ isActive: 1 });
ContentPageSchema.index({ createdAt: -1 });

// Middleware para ordenar secciones antes de guardar
ContentPageSchema.pre('save', function (this: IContentPageDocument, next) {
  if (this.sections && this.sections.length > 0) {
    // Ordenar secciones por el campo order
    this.sections.sort((a: IContentSection, b: IContentSection) => a.order - b.order);

    // Ordenar bloques dentro de cada sección
    this.sections.forEach((section: IContentSection) => {
      if (section.blocks && section.blocks.length > 0) {
        section.blocks.sort((a: IContentBlock, b: IContentBlock) => (a.order || 0) - (b.order || 0));
      }
    });
  }
  next();
});

// Método estático para obtener página por slug
ContentPageSchema.statics.findBySlug = function (slug: string) {
  return this.findOne({ slug, isActive: true });
};

// Método de instancia para validar estructura
ContentPageSchema.methods.validateStructure = function (this: IContentPageDocument): boolean {
  try {
    // Verificar que todas las secciones tengan título
    const invalidSections = this.sections.some(section => {
      if (!section.title || section.title.trim().length === 0) {
        return true;
      }

      // Verificar que todos los bloques tengan valores válidos
      return section.blocks.some(block => {
        if (block.type === ContentBlockType.LIST) {
          return !Array.isArray(block.value) || block.value.length === 0 ||
            block.value.some((item: any) => typeof item !== 'string' || item.trim().length === 0);
        } else if (block.type === ContentBlockType.FAQ) {
          return !Array.isArray(block.value) || block.value.length === 0 ||
            block.value.some((item: any) =>
              typeof item !== 'object' ||
              typeof item.question !== 'string' ||
              item.question.trim().length === 0 ||
              typeof item.answer !== 'string' ||
              item.answer.trim().length === 0
            );
        } else {
          return typeof block.value !== 'string' || block.value.trim().length === 0;
        }
      });
    });

    return !invalidSections;
  } catch (error: any) {
    console.error('Error en validateStructure:', error);
    return false;
  }
};

// Exportar el modelo principal
export const ContentPageModel = mongoose.model<IContentPageDocument, IContentPageModel>('ContentPage', ContentPageSchema);

// Exportar alias para compatibilidad con el index
export const ContentPage = ContentPageModel;

// Exportar los schemas para uso interno si es necesario
export { ContentBlockSchema, ContentSectionSchema };