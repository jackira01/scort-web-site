// Tipos para el módulo de noticias (Tablero de noticias)

export interface News {
  _id: string;
  title: string;
  content: string[]; // Array de strings para los patch notes
  published: boolean;
  createdAt: string;
  updatedAt: string;
  __v?: number;
  id?: string;
}

// Tipos para formularios
export interface CreateNewsRequest {
  title: string;
  content: string[];
  published?: boolean;
}

export interface UpdateNewsRequest extends Partial<CreateNewsRequest> {
  _id: string;
}

// Tipos para respuestas de API
export interface NewsResponse {
  success: boolean;
  message: string;
  data: News;
}

export interface NewsListResponse {
  success: boolean;
  message: string;
  data: News[];
  pagination?: {
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };
}

// Tipos para filtros y paginación
export interface NewsFilters {
  published?: boolean;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface NewsPaginationParams {
  page?: number;
  limit?: number;
  skip?: number;
}

// Tipos para el estado del componente
export interface NewsManagerState {
  selectedNews?: News;
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  isLoading: boolean;
}

// Tipos para formularios de creación/edición
export interface NewsFormData {
  title: string;
  content: string[];
  published: boolean;
}

// Tipos para errores
export interface NewsError {
  message: string;
  field?: string;
}

// Tipos para el hook de noticias
export interface UseNewsOptions {
  filters?: NewsFilters & NewsPaginationParams;
  enabled?: boolean;
}

export interface UseNewsResult {
  news: News[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// Tipos para mutaciones
export interface NewsMutationResult {
  isLoading: boolean;
  error: Error | null;
  mutate: (data: any) => void;
  reset: () => void;
}