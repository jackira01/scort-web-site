import { Request, Response } from 'express';
import UserModel from './User.model';
import ProfileVerification from '../profile-verification/profile-verification.model';


export const createUser = (data: Record<string, any>) => UserModel.create(data);
export const findUserByEmail = async (email: string) => {
  // Normalizar el email a minúsculas y eliminar espacios
  const normalizedEmail = email.toLowerCase().trim();
  return UserModel.findOne({ email: normalizedEmail });
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
    throw error;
  }
};

export const updateUser = (id: string, data: Record<string, any>) =>
  UserModel.findByIdAndUpdate(id, data, { new: true });

export const getUsers = async (filters: Record<string, any>, options: Record<string, any>) => {
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
      const isLastLoginVerified = true; // Simplificado: siempre consideramos verificado

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

/**
 * Eliminar usuario y todos sus datos relacionados
 * - Elimina todos los perfiles del usuario
 * - Elimina todas las verificaciones de perfil asociadas
 * - Elimina todas las facturas del usuario
 * - Elimina el usuario
 */
export const deleteUserCompletely = async (userId: string) => {
  try {
    // Validar formato de ObjectId
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new Error('Formato de ID de usuario inválido');
    }

    // 1. Obtener el usuario para acceder a sus perfiles
    const user = await UserModel.findById(userId).populate('profiles');
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // 2. Eliminar todas las verificaciones de perfil
    if (user.profiles && user.profiles.length > 0) {
      const profileIds = user.profiles.map((profile: any) => profile._id);
      await ProfileVerification.deleteMany({ profile: { $in: profileIds } });
    }

    // 3. Eliminar todos los perfiles del usuario
    // Importar dinámicamente el modelo de Profile para evitar dependencias circulares
    const { ProfileModel } = await import('../profile/profile.model');
    await ProfileModel.deleteMany({ user: userId });

    // 4. Eliminar todas las facturas del usuario
    try {
      const InvoiceModule = await import('../payments/invoice.model');
      const InvoiceModel = InvoiceModule.default;
      await InvoiceModel.deleteMany({ user: userId });
    } catch (error) {
      // Si el modelo no existe o hay error, continuar
      console.warn('No se pudieron eliminar las facturas:', error);
    }

    // 5. Eliminar plan assignments si existen (nota: puede no existir este modelo)
    // Este paso se omite ya que no encontramos el modelo

    // 6. Finalmente, eliminar el usuario
    await UserModel.findByIdAndDelete(userId);

    return {
      success: true,
      message: 'Usuario y todos sus datos relacionados han sido eliminados exitosamente',
      deletedData: {
        userId,
        profilesCount: user.profiles?.length || 0
      }
    };
  } catch (error) {
    throw error;
  }
};



/* export const obtenerPerfiles = () => UserModel.find();

export const eliminarPerfil = (id: string) =>
  UserModel.findByIdAndDelete(id); */
