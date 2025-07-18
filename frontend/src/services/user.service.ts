import { BaseUser, User } from '@/types/user.types';
import axios from 'axios';
import toast from 'react-hot-toast';


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

export const getUserById = async (userId: string): Promise<User> => {
    const response = await axios.get(`${API_URL}/api/user/${userId}`);
    return response.data;
};

export const updateUser = async (userId: string, data: any,) => {
    const response = await axios.put(`${API_URL}/api/user/${userId}`, data);
    return response.data;
}