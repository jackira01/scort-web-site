import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type User = {
    email: string;
    name?: string;
}

export const authUser = async (data: User) => {
    try {
        const response = await axios.post(`${API_URL}/api/user/auth_google`, data);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data;
        }
        return { message: 'An unknown error occurred.' };
    }
};
