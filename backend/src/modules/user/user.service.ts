import { Request, Response } from 'express';
import UserModel from './User.model';
import ProfileVerification from '../profile-verification/profile-verification.model';
import { checkLastLoginVerification } from '../profile-verification/verification-progress.utils';

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

export const getUserById = async (id: string) => {
  try {
    // Validar formato de ObjectId de MongoDB
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new Error('Formato de ID de usuario inválido');
    }
    
    return await UserModel.findById(id);
  } catch (error) {
    console.error('Error en getUserById service:', error);
    throw error;
  }
};

export const updateUser = (id: string, data: any) =>
  UserModel.findByIdAndUpdate(id, data, { new: true });

export const getUsers = async (filters: any, options: any) => {
  return await UserModel.paginate(filters, options);

};

export const getUserProfiles = async (userId: string, includeInactive: boolean = false) => {
  const user = await UserModel.findById(userId).populate({
    path: 'profiles',
    select: '_id user name age location verification media planAssignment upgrades visible isActive isDeleted',
    populate: {
      path: 'verification',
      model: 'ProfileVerification',
      select: 'verificationProgress verificationStatus'
    }
  });
  
  let profiles = user?.profiles || [];
  
  // Filtrar perfiles eliminados lógicamente (isDeleted: true) para usuarios normales
  // Solo los administradores pueden ver perfiles con isDeleted: true
  if (!includeInactive) {
    profiles = profiles.filter((profile: any) => profile.isDeleted !== true);
  }
  
  const now = new Date();
  
  // Devolver los perfiles con información completa incluyendo upgrades activos
  return profiles.map((profile: any) => {
    // Filtrar upgrades activos
    const activeUpgrades = profile.upgrades?.filter((upgrade: any) => 
      new Date(upgrade.startAt) <= now && new Date(upgrade.endAt) > now
    ) || [];
    
    // Verificar si tiene upgrades específicos activos o incluidos en el plan
    let hasDestacadoUpgrade = activeUpgrades.some((upgrade: any) => 
      upgrade.code === 'DESTACADO' || upgrade.code === 'HIGHLIGHT'
    );
    let hasImpulsoUpgrade = activeUpgrades.some((upgrade: any) => 
      upgrade.code === 'IMPULSO' || upgrade.code === 'BOOST'
    );
    
    // Si es plan DIAMANTE, incluye DESTACADO automáticamente
    if (profile.planAssignment?.planCode === 'DIAMANTE') {
      hasDestacadoUpgrade = true;
    }
    
    return {
      _id: profile._id,
      user: profile.user,
      name: profile.name,
      age: profile.age,
      location: profile.location,
      verification: profile.verification,
      media: profile.media,
      planAssignment: profile.planAssignment,
      upgrades: profile.upgrades,
      activeUpgrades,
      hasDestacadoUpgrade,
      hasImpulsoUpgrade,
      visible: profile.visible,
      isActive: profile.isActive
    };
  });
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
    
    // Actualizar también las verificaciones de perfil asociadas
    if (user && user.profiles.length > 0) {
      const isLastLoginVerified = checkLastLoginVerification(user.lastLogin.date);
      
      // Actualizar todas las verificaciones de perfiles del usuario
      await ProfileVerification.updateMany(
        { profile: { $in: user.profiles } },
        {
          $set: {
            'steps.lastLogin.isVerified': isLastLoginVerified,
            'steps.lastLogin.date': user.lastLogin.date
          }
        }
      );
    }
    
    return user;
  } catch (error) {
    throw new Error(`Error al actualizar lastLogin: ${error}`);
  }
};



/* export const obtenerPerfiles = () => UserModel.find();

export const eliminarPerfil = (id: string) =>
  UserModel.findByIdAndDelete(id); */
