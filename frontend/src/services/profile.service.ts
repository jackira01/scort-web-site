import axios from '@/lib/axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const getAllProfiles = async (page: number = 1, limit: number = 10, fields?: string) => {
  const body = {
    page,
    limit,
    ...(fields && { fields })
  };

  const response = await axios.post(`${API_URL}/api/profile/list`, body);
  return response.data;
};

export const getProfileById = async (id: string) => {
  const response = await axios.get(`${API_URL}/profile/${id}`);
  return response.data;
};

export const getProfilesWithStories = async (page: number = 1, limit: number = 10) => {
  const response = await axios.get(`${API_URL}/api/profile/stories`, {
    params: {
      page,
      limit
    }
  });
  return response.data;
};

export const getAllProfilesForAdmin = async (page: number = 1, limit: number = 10, fields?: string | string[], userId?: string) => {
  // Convertir fields a array si es string
  const fieldsArray = typeof fields === 'string'
    ? fields.split(',').map(f => f.trim()).filter(Boolean)
    : fields;

  const payload = {
    page,
    limit,
    ...(fieldsArray && { fields: fieldsArray }),
    ...(userId && { userId })
  };

  console.log('📡 [ADMIN API] Solicitando perfiles:', payload);

  const response = await axios.post(`${API_URL}/api/profile/admin/all`, payload);
  return response.data;
};