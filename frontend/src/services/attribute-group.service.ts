import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const getAttributeGroups = async () => {
    const response = await axios.get(`${API_URL}/api/attribute-groups`);

    return response.data;
};