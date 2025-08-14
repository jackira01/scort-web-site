import { Request, Response } from 'express';
import UserModel from './User.model';

export const createUser = (data: any) => UserModel.create(data);
export const findUserByEmail = async (email: string) => {
  return UserModel.findOne({ email });
};

export const uploadUserDocument = async (userId: string, documentUrl: string) => {
  const options = { new: true };
  const data = { verificationDocument: documentUrl };
  if (!userId || !documentUrl) {
    throw new Error('Faltan datos requeridos');
  }
  const user = await UserModel.findByIdAndUpdate(
    userId,
    data,
    options);
  return user;
};

export const getUserById = (id: string) => UserModel.findById(id);

export const updateUser = (id: string, data: any) =>
  UserModel.findByIdAndUpdate(id, data, { new: true });

export const getUsers = async (filters: any, options: any) => {
  return await UserModel.paginate(filters, options);

};

export const getUserProfiles = async (userId: string) => {
  const user = await UserModel.findById(userId).populate({
    path: 'profiles',
    select: '_id user name age location verification media',
    populate: {
      path: 'verification',
      model: 'ProfileVerification',
      select: 'verificationProgress verificationStatus'
    }
  });
  
  const profiles = user?.profiles || [];
  
  // Transformar los perfiles para agregar profileImage
  return profiles.map((profile: any) => ({
    _id: profile._id,
    user: profile.user,
    name: profile.name,
    age: profile.age,
    location: profile.location,
    verification: profile.verification,
    profileImage: profile.media?.gallery?.[0] || null
  }));
}

// Actualizar lastLogin del usuario
export const updateUserLastLogin = async (userId: string) => {
  try {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      {
        'lastLogin.date': new Date(),
        'lastLogin.isVerified': true
      },
      { new: true }
    );
    return user;
  } catch (error) {
    throw new Error(`Error al actualizar lastLogin: ${error}`);
  }
};



/* export const obtenerPerfiles = () => UserModel.find();

export const eliminarPerfil = (id: string) =>
  UserModel.findByIdAndDelete(id); */
