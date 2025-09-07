import axios from '@/lib/axios';
import type { BaseUser, User } from '@/types/user.types';

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
    const response = await axios.get(`${API_URL}/api/user/${userId}`);
    return response.data;
};

export const updateUser = async (userId: string, data: any) => {
    const response = await axios.put(`${API_URL}/api/user/${userId}`, data);
    return response.data;
};

export const getUsers = async (page: number, limit: number, filters: any) => {
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

export const createProfile = async (profileData: any, purchasedPlan: any) => {
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
    const response = await axios.get(`${API_URL}/api/profile-verification/profile/${profileId}`);
    return response.data;
}

export const updateProfile = async (profileId: string, data: any) => {
    const response = await axios.put(`${API_URL}/api/profile/${profileId}`, data);
    return response.data;
}

export const updateUserLastLogin = async (userId: string) => {
    const response = await axios.put(`${API_URL}/api/user/${userId}/last-login`);
    return response.data;
}

export const deleteProfile = async (profileId: string) => {
    const response = await axios.delete(`${API_URL}/api/profile/${profileId}`);
    return response.data;
}

// Borrado lógico de perfil (para usuarios)
export const softDeleteProfile = async (profileId: string) => {
    const response = await axios.patch(`${API_URL}/api/profile/${profileId}/soft-delete`);
    return response.data;
}

// Borrado físico de perfil (para administradores)
export const hardDeleteProfile = async (profileId: string) => {
    const response = await axios.delete(`${API_URL}/api/profile/${profileId}/hard-delete`);
    return response.data;
}

// Restaurar perfil (reactivar después de borrado lógico)
export const restoreProfile = async (profileId: string) => {
    const response = await axios.patch(`${API_URL}/api/profile/${profileId}/restore`);
    return response.data;
}

// Obtener perfiles eliminados lógicamente (para administradores)
export const getDeletedProfiles = async (page: number = 1, limit: number = 10) => {
    const response = await axios.get(`${API_URL}/api/profile/deleted?page=${page}&limit=${limit}`);
    return response.data;
}
