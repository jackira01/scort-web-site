import axios from '@/lib/axios';
import { isAxiosError } from 'axios';
import type { BaseUser, User, Profile } from '@/types/user.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const authUser = async (data: User): Promise<BaseUser> => {
    const response = await axios.post(`${API_URL}/api/user/auth_google`, data);
    return response.data;
};

/* export const uploadDocumentUser = async (userId: string, documentsUrl: string) => {
    try {
        const response = await axios.post(`${API_URL}/api/user/upload_user_document`, { userId, documentsUrl });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data;
        }
        return { message: 'An unknown error occurred.' };
    }
} */

export const getUserById = async (userId: string | undefined): Promise<User> => {
    if (!userId || userId === 'undefined') {
        throw new Error('User ID is required and cannot be undefined');
    }
    const response = await axios.get(`${API_URL}/api/user/${userId}`);
    return response.data;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
    try {
        const response = await axios.get(`${API_URL}/api/user/email/${email}`);
        return response.data;
    } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
            return null;
        }
        throw error;
    }
};

export const updateUser = async (userId: string, data: Partial<User>) => {
    const response = await axios.put(`${API_URL}/api/user/${userId}`, data);
    return response.data;
};

export const getUsers = async (page: number, limit: number, filters: Record<string, unknown>) => {
    const response = await axios.post(`${API_URL}/api/user/?page=${page}&limit=${limit}`, filters);

    return response.data;
};

export const verifyProfileName = async (profileName: string) => {
    const response = await axios.get(`${API_URL}/api/profile/verify-profile-name/?profileName=${profileName}`);
    return response.data;
};

export const getUserProfiles = async (userId: string) => {
    const response = await axios.get(`${API_URL}/api/user/${userId}/profiles`);
    return response.data;
}

export const createProfile = async (profileData: Partial<Profile>, purchasedPlan: Record<string, unknown>) => {
    const requestBody = {
        profileData,
        purchasedPlan
    };
    const response = await axios.post(`${API_URL}/api/profile/`, requestBody);
    return response.data;
}

export const getProfileById = async (profileId: string) => {
    const response = await axios.get(`${API_URL}/api/profile/${profileId}`);
    return response.data;
}

export const getProfileVerification = async (profileId: string) => {
    try {
        console.log('🔍 Fetching profile verification for profileId:', profileId);
        const response = await axios.get(`${API_URL}/api/profile-verification/profile/${profileId}`);
        console.log('📊 Profile verification response:', response.data);

        // Si el backend devuelve { success: true, data: {} } pero data está vacío,
        // crear una estructura de verificación por defecto
        if (response.data.success && (!response.data.data || Object.keys(response.data.data).length === 0)) {
            console.log('⚠️ No verification data found, creating default structure');

            // Crear un nuevo registro de verificación
            const createResponse = await axios.post(`${API_URL}/api/profile-verification`, {
                profile: profileId,
                verificationStatus: 'pending',
                verificationProgress: 0,
                data: {
                    steps: {
                        documentPhotos: {
                            frontPhoto: '',
                            backPhoto: '',
                            selfieWithDocument: '',
                            isVerified: false
                        },
                        videoVerification: {
                            videoLink: '',
                            isVerified: false
                        },
                        videoCallRequested: {
                            videoLink: '',
                            isVerified: false
                        },
                        socialMedia: {
                            isVerified: false
                        }
                    }
                }
            });

            console.log('✅ Created new verification record:', createResponse.data);
            return createResponse.data;
        }

        return response.data;
    } catch (error) {
        console.error('❌ Error fetching profile verification:', error);
        throw error;
    }
}

export const updateProfile = async (profileId: string, data: Partial<Profile>) => {
    const response = await axios.put(`${API_URL}/api/profile/${profileId}`, data);
    return response.data;
}

export const updateUserLastLogin = async (userId: string) => {
    const response = await axios.put(`${API_URL}/api/user/${userId}/last-login`);
    return response.data;
}

// Ocultar perfil visualmente (para usuarios normales)
export const hideProfile = async (profileId: string) => {
    const response = await axios.patch(`${API_URL}/api/profile/${profileId}/hide`);
    return response.data;
}

// Mostrar perfil oculto (para usuarios normales)
export const showProfile = async (profileId: string) => {
    const response = await axios.patch(`${API_URL}/api/profile/${profileId}/show`);
    return response.data;
}

// Eliminar perfil (borrado lógico para usuarios normales)
export const deleteProfile = async (profileId: string) => {
    const response = await axios.patch(`${API_URL}/api/profile/${profileId}/delete`);
    return response.data;
}

// Borrado lógico de perfil (para administradores)
export const softDeleteProfile = async (profileId: string) => {
    const response = await axios.patch(`${API_URL}/api/profile/${profileId}/soft-delete`);
    return response.data;
}

// Borrado físico de perfil (para administradores)
export const hardDeleteProfile = async (profileId: string) => {
    const response = await axios.delete(`${API_URL}/api/profile/${profileId}/hard-delete`);
    return response.data;
}

// Restaurar perfil (reactivar después de borrado lógico - solo administradores)
export const restoreProfile = async (profileId: string) => {
    const response = await axios.patch(`${API_URL}/api/profile/${profileId}/restore`);
    return response.data;
}

// Obtener perfiles eliminados lógicamente (para administradores)
export const getDeletedProfiles = async (page: number = 1, limit: number = 10) => {
    const response = await axios.get(`${API_URL}/api/profile/deleted?page=${page}&limit=${limit}`);
    return response.data;
}
