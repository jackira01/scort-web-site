import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;


export const getProfileById = async (id: string) => {
  const response = await axios.get(`${API_URL}/profile/${id}`);
  return response.data;
};