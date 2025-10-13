import { Document, Types } from 'mongoose';

/**
 * Tipos de bloques de contenido soportados
 */
export enum ContentBlockType {
  PARAGRAPH = 'paragraph',
  LIST = 'list',
  IMAGE = 'image',
  LINK = 'link'
}

/**
 * Interfaz para un bloque de contenido individual
 */
export interface IContentBlock {
  type: ContentBlockType;
  value: string | string[]; // string para párrafo/imagen/link, string[] para lista
  order?: number; // orden dentro de la sección
}

/**
 * Interfaz para una sección de contenido
 */
export interface IContentSection {
  title: string;
  order: number;
  blocks: IContentBlock[];
}

/**
 * Interfaz para una página de contenido completa
 */
export interface IContentPage extends Document {
  slug: string; // "faq", "terms", "privacy", etc.
  title: string; // título de la página
  sections: IContentSection[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  modifiedBy: Types.ObjectId; // ObjectId del usuario que modificó
}

/**
 * Input para crear una nueva página de contenido
 */
export interface CreateContentPageInput {
  slug: string;
  title: string;
  sections: IContentSection[];
  modifiedBy: string | Types.ObjectId;
  isActive?: boolean;
}

/**
 * Input para actualizar una página de contenido existente
 */
export interface UpdateContentPageInput {
  title?: string;
  sections?: IContentSection[];
  modifiedBy: string | Types.ObjectId;
  isActive?: boolean;
}

/**
 * Respuesta de la API para páginas de contenido
 */
export interface ContentPageResponse {
  success: boolean;
  data?: IContentPage;
  message?: string;
}

/**
 * Respuesta de la API para listado de páginas
 */
export interface ContentPagesListResponse {
  success: boolean;
  data?: IContentPage[];
  total?: number;
  message?: string;
}