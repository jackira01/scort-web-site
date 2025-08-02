import { validateProfileFeatures } from '../attribute-group/validateProfileFeatures';
import { ProfileModel } from './profile.model';
import type { CreateProfileDTO } from './profile.types';
import UserModel from '../user/User.model';

export const checkProfileNameExists = async (name: string) => {
  const profile = await ProfileModel.findOne({ name });
  if (profile) {
    return { user: profile.user, exists: true, message: 'El nombre del perfil ya está en uso' };
  }
  return {
    user: null,
    exists: false,
    message: 'El nombre del perfil no está en uso',
  };
};


export const createProfile = async (data: CreateProfileDTO) => {
  await validateProfileFeatures(data.features);
  const { exists, message } = await checkProfileNameExists(data.name);
  if (exists) {
    throw new Error(message);
  }
  
  const profile = await ProfileModel.create(data);
  
  // Agregar el perfil al array de profiles del usuario
  await UserModel.findByIdAndUpdate(
    data.user,
    { $push: { profiles: profile._id } },
    { new: true }
  );
  
  return profile;
};

export const getProfiles = async () => {
  return ProfileModel.find().populate('user');
};

export const getProfileById = async (id: string) => {
  return ProfileModel.findById(id).populate('user');
};

export const updateProfile = async (id: string, data: Partial<CreateProfileDTO>) => {
  return ProfileModel.findByIdAndUpdate(id, data, { new: true });
};

export const deleteProfile = async (id: string) => {
  return ProfileModel.findByIdAndDelete(id);
};
