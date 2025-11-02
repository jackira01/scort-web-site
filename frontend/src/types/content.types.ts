// Tipos para el sistema de contenido configurable

export enum ContentBlockType {
  PARAGRAPH = 'paragraph',
  LIST = 'list',
  IMAGE = 'image',
  LINK = 'link',
  FAQ = 'faq'
}

export interface IFaqItem {
  question: string;
  answer: string;
}

export interface IContentBlock {
  type: ContentBlockType;
  value: string | string[] | IFaqItem[];
  order?: number;
}

export interface IContentSection {
  title: string;
  order: number;
  blocks: IContentBlock[];
}

export interface IContentPage {
  _id?: string;
  slug: string;
  title: string;
  sections: IContentSection[];
  isActive?: boolean;
  modifiedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  description?: string;
}

// Tipos para las operaciones CRUD
export interface CreateContentPageInput {
  slug: string;
  title: string;
  sections: IContentSection[];
  isActive?: boolean;
  modifiedBy?: string;
}

export interface UpdateContentPageInput {
  title?: string;
  sections?: IContentSection[];
  isActive?: boolean;
  modifiedBy?: string;
}

// Tipos para las respuestas de la API
export interface ContentPageResponse {
  success: boolean;
  data?: IContentPage;
  message?: string;
}

export interface ContentPagesListResponse {
  success: boolean;
  data?: IContentPage[];
  total?: number;
  message?: string;
}

// Tipos para paginación
export interface ContentPaginationParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}

export interface ContentPaginationResponse {
  success: boolean;
  data?: IContentPage[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

// Tipos para duplicación de páginas
export interface DuplicatePageInput {
  newSlug: string;
  newTitle: string;
}