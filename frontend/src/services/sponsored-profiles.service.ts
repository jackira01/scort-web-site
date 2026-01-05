import { API_URL } from '@/lib/config';
import type { IProfile } from '@/types/profile.types';

export interface SponsoredProfilesQuery {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'lastShownAt';
  sortOrder?: 'asc' | 'desc';
  fields?: string[];
  category?: string;
  department?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  identityVerified?: boolean;
  hasVideo?: boolean;
  documentVerified?: boolean;
  features?: Record<string, string | string[]>;
}

export interface SponsoredProfilesResponse {
  profiles: IProfile[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalProfiles: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface SponsoredProfilesApiResponse {
  success: boolean;
  data: IProfile[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalProfiles: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  message: string;
}

export interface SponsoredProfilesCountResponse {
  success: boolean;
  data: {
    totalCount: number;
  };
  message: string;
}

export interface ProfileSponsoredCheckResponse {
  success: boolean;
  data: {
    profileId: string;
    isSponsored: boolean;
  };
  message: string;
}

/**
 * Obtiene perfiles patrocinados que cumplen con todos los criterios de validación
 */
export const getSponsoredProfiles = async (
  query: SponsoredProfilesQuery = {}
): Promise<SponsoredProfilesResponse> => {
  try {
    // Construir parámetros de consulta
    const searchParams = new URLSearchParams();

    if (query.page !== undefined) {
      searchParams.append('page', query.page.toString());
    }

    if (query.limit !== undefined) {
      searchParams.append('limit', query.limit.toString());
    }

    if (query.sortBy) {
      searchParams.append('sortBy', query.sortBy);
    }

    if (query.sortOrder) {
      searchParams.append('sortOrder', query.sortOrder);
    }

    if (query.fields && query.fields.length > 0) {
      searchParams.append('fields', query.fields.join(','));
    }

    if (query.category) {
      searchParams.append('category', query.category);
    }

    if (query.department) {
      searchParams.append('department', query.department);
    }

    if (query.city) {
      searchParams.append('city', query.city);
    }

    if (query.minPrice !== undefined) {
      searchParams.append('minPrice', query.minPrice.toString());
    }

    if (query.maxPrice !== undefined) {
      searchParams.append('maxPrice', query.maxPrice.toString());
    }

    if (query.identityVerified !== undefined) {
      searchParams.append('identityVerified', query.identityVerified.toString());
    }

    if (query.hasVideo !== undefined) {
      searchParams.append('hasVideo', query.hasVideo.toString());
    }

    if (query.documentVerified !== undefined) {
      searchParams.append('documentVerified', query.documentVerified.toString());
    }

    const url = `${API_URL}/api/sponsored-profiles${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

    // Si hay features, usar POST, sino GET
    const method = query.features && Object.keys(query.features).length > 0 ? 'POST' : 'GET';
    const body = method === 'POST' ? JSON.stringify({ features: query.features }) : undefined;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData: SponsoredProfilesApiResponse = await response.json();

    if (responseData.success && responseData.data) {
      return {
        profiles: responseData.data,
        pagination: responseData.pagination,
      };
    } else {
      throw new Error(responseData.message || 'Error al obtener perfiles patrocinados');
    }

  } catch (error) {
    console.error('Error en getSponsoredProfiles:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Error desconocido al obtener perfiles patrocinados'
    );
  }
};

/**
 * Obtiene el conteo total de perfiles patrocinados válidos
 */
export const getSponsoredProfilesCount = async (): Promise<number> => {
  try {
    const url = `${API_URL}/api/sponsored-profiles/count`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData: SponsoredProfilesCountResponse = await response.json();

    if (responseData.success && responseData.data) {
      return responseData.data.totalCount;
    } else {
      throw new Error(responseData.message || 'Error al obtener conteo de perfiles patrocinados');
    }

  } catch (error) {
    console.error('Error en getSponsoredProfilesCount:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Error desconocido al obtener conteo de perfiles patrocinados'
    );
  }
};

/**
 * Verifica si un perfil específico es elegible para aparecer en la sección patrocinada
 */
export const checkProfileSponsored = async (profileId: string): Promise<boolean> => {
  try {
    if (!profileId) {
      throw new Error('ID de perfil requerido');
    }

    const url = `${API_URL}/api/sponsored-profiles/check/${profileId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData: ProfileSponsoredCheckResponse = await response.json();

    if (responseData.success && responseData.data) {
      return responseData.data.isSponsored;
    } else {
      throw new Error(responseData.message || 'Error al verificar perfil patrocinado');
    }

  } catch (error) {
    console.error('Error en checkProfileSponsored:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Error desconocido al verificar perfil patrocinado'
    );
  }
};

/**
 * Obtiene perfiles patrocinados optimizados para tarjetas (campos específicos)
 */
export const getSponsoredProfilesForCards = async (
  page: number = 1,
  limit: number = 20
): Promise<SponsoredProfilesResponse> => {
  // Campos optimizados para mostrar en tarjetas
  const cardFields = [
    '_id',
    'name',
    'age',
    'location',
    'media.gallery',
    'verification',
    'planAssignment',
    'upgrades',
    'activeUpgrades',
    'hasDestacadoUpgrade',
    'isActive',
    'visible',
    'category'
  ];

  return getSponsoredProfiles({
    page,
    limit,
    sortBy: 'lastShownAt', // Rotación para mostrar diferentes perfiles
    sortOrder: 'asc',
    fields: cardFields
  });
};