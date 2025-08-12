import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const getAllProfiles = async (page: number = 1, limit: number = 10) => {
  const response = await axios.get(`${API_URL}/api/profile?page=${page}&limit=${limit}`);
  return response.data;
};

export const getProfileById = async (id: string) => {
  const response = await axios.get(`${API_URL}/profile/${id}`);
  return response.data;
};