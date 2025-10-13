import ProfileVerification from './profile-verification.model';
import type { IProfileVerification } from '../profile/profile.types';
import type { Types } from 'mongoose';
import { type IUser } from '../user/User.model';
import { ProfileModel } from '../profile/profile.model';
import type { IProfile } from '../profile/profile.types';

// Interface para Profile con User poblado
interface IProfileWithUser extends Omit<IProfile, 'user'> {
  user: IUser;
}

// Interface para ProfileVerification con Profile y User poblados
interface IProfileVerificationWithPopulatedProfile extends Omit<IProfileVerification, 'profile'> {
  profile: IProfileWithUser;
}

// Función para determinar si una agencia requiere verificación independiente
const shouldRequireIndependentVerification = async (userId: string | Types.ObjectId, currentProfileId: string | Types.ObjectId) => {
  try {
    // Contar perfiles existentes del usuario
    const existingProfilesCount = await ProfileModel.countDocuments({ user: userId });

    // Si es el primer perfil, no requiere verificación independiente
    if (existingProfilesCount <= 1) {
      return false;
    }

    // Para perfiles adicionales de agencias, siempre requiere verificación independiente
    return true;
  } catch (error) {
    // Por seguridad, requerir verificación en caso de error
    return true;
  }
};

// Función para obtener steps por defecto - versión simplificada
const getDefaultVerificationSteps = (accountType: string, requiresIndependentVerification: boolean, lastLoginVerified: boolean, userLastLoginDate: Date | null) => {
  const baseSteps = {
    documentPhotos: {
      frontPhoto: undefined,
      backPhoto: undefined,
      selfieWithDocument: undefined,
      isVerified: false
    },
    videoVerification: {
      videoLink: undefined,
      isVerified: false
    },
    videoCallRequested: {
      videoLink: undefined,
      isVerified: false
    },
    socialMedia: {
      isVerified: false
    },
    phoneChangeDetected: false,
    lastLogin: {
      isVerified: lastLoginVerified,
      date: userLastLoginDate
    }
  };

  // Para usuarios comunes con múltiples perfiles, mantener verificación manual
  if (accountType === 'common' && !requiresIndependentVerification) {
    return {
      ...baseSteps,
      documentPhotos: {
        frontPhoto: undefined,
        backPhoto: undefined,
        selfieWithDocument: undefined,
        isVerified: false // Mantener false hasta verificación manual del admin
      }
    };
  }

  // Para agencias o verificación independiente, mantener valores por defecto
  return baseSteps;
};
import {
  CreateProfileVerificationDTO,
  UpdateProfileVerificationDTO,
  UpdateVerificationStatusDTO,
  UpdateVerificationStepsDTO,
  ProfileVerificationFiltersDTO
} from './profile-verification.types';
import { calculateVerificationProgress } from './verification-progress.utils';

// Función auxiliar para recalcular el progreso de verificación
const recalculateVerificationProgress = async (verification: IProfileVerification) => {
  try {


    // Obtener datos del usuario asociado al perfil
    const populatedVerification = await ProfileVerification.findById(verification._id)
      .populate({
        path: 'profile',
        populate: {
          path: 'user',
          model: 'User'
        }
      })
      .lean() as unknown as IProfileVerificationWithPopulatedProfile | null;

    if (!populatedVerification?.profile) {

      return verification.verificationProgress;
    }

    const user = populatedVerification.profile.user;
    const newProgress = calculateVerificationProgress(verification, user);



    // Actualizar SOLO el progreso en la base de datos, sin tocar los steps
    const updatedVerification = await ProfileVerification.findByIdAndUpdate(
      verification._id,
      { $set: { verificationProgress: newProgress } },
      { new: true }
    ).lean();



    return newProgress;
  } catch (error) {

    return verification.verificationProgress;
  }
};

// Obtener verificación por ID de perfil
export const getProfileVerificationByProfileId = async (profileId: string | Types.ObjectId) => {
  try {
    const verification = await ProfileVerification.findOne({ profile: profileId })
      .populate({
        path: 'profile',
        select: 'name user createdAt',
        populate: {
          path: 'user',
          select: 'accountType lastLogin'
        }
      })
      .lean();

    return verification;
  } catch (error) {
    throw new Error(`Error al obtener verificación del perfil: ${error}`);
  }
};

// Obtener verificación por ID
export const getProfileVerificationById = async (verificationId: string | Types.ObjectId) => {
  try {
    const verification = await ProfileVerification.findById(verificationId)
      .populate('profile', 'name user')
      .lean();

    return verification;
  } catch (error) {
    throw new Error(`Error al obtener verificación: ${error}`);
  }
};

// Crear nueva verificación
export const createProfileVerification = async (verificationData: CreateProfileVerificationDTO) => {
  try {
    // Obtener datos del usuario para inicializar correctamente lastLogin
    let userLastLoginDate = null;
    let lastLoginVerified = true; // Por defecto true para perfiles nuevos
    let accountType = 'common'; // Por defecto común
    let requiresIndependentVerification = false;

    if (verificationData.profile) {
      // Buscar el perfil y su usuario asociado
      const profile = await ProfileModel.findById(verificationData.profile).populate('user') as unknown as IProfileWithUser | null;
      // Verificar que user esté poblado correctamente
      if (profile && profile.user) {
        accountType = profile.user.accountType || 'common';

        if (profile.user.lastLogin?.date) {
          userLastLoginDate = profile.user.lastLogin.date;
          lastLoginVerified = true; // Simplificado: siempre consideramos verificado
        }

        // Para agencias, verificar si requiere verificación independiente
        if (accountType === 'agency') {
          const userId = (profile.user as any)._id || (profile.user as any).id;
          requiresIndependentVerification = await shouldRequireIndependentVerification(userId, verificationData.profile);
        }
      }
    }

    // Inicializar steps con valores por defecto basados en el tipo de cuenta
    const defaultSteps = getDefaultVerificationSteps(accountType, requiresIndependentVerification, lastLoginVerified, userLastLoginDate);

    const verificationWithDefaults = {
      ...verificationData,
      steps: defaultSteps,
      verificationProgress: 0,
      accountType,
      requiresIndependentVerification
    };

    const verification = new ProfileVerification(verificationWithDefaults);
    await verification.save();

    const populatedVerification = await ProfileVerification.findById(verification._id)
      .populate('profile', 'name user')
      .lean();

    return populatedVerification;
  } catch (error) {
    throw new Error(`Error al crear verificación: ${error}`);
  }
};

// Actualizar verificación
export const updateProfileVerification = async (
  verificationId: string | Types.ObjectId,
  updateData: UpdateProfileVerificationDTO
) => {
  try {
    // Verificar si se están actualizando pasos de verificación
    const isUpdatingSteps = 'steps' in updateData && (updateData as any).steps !== undefined;

    const verification = await ProfileVerification.findByIdAndUpdate(
      verificationId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('profile', 'name user')
      .lean();

    if (!verification) {
      throw new Error('Verificación no encontrada');
    }

    // Recalcular progreso solo si se actualizaron pasos de verificación
    if (isUpdatingSteps) {
      await recalculateVerificationProgress(verification as unknown as IProfileVerification);

      // Obtener la verificación actualizada con el nuevo progreso
      const updatedVerification = await ProfileVerification.findById(verificationId)
        .populate('profile', 'name user')
        .lean();

      return updatedVerification;
    }

    return verification;
  } catch (error) {
    throw new Error(`Error al actualizar verificación: ${error}`);
  }
};

// Actualizar pasos específicos de verificación
export const updateVerificationSteps = async (
  verificationId: string | Types.ObjectId,
  stepsUpdate: UpdateVerificationStepsDTO
) => {
  try {


    // Primero obtener los datos actuales para hacer un merge correcto
    const currentVerification = await ProfileVerification.findById(verificationId).lean();
    if (!currentVerification) {
      throw new Error('Verificación no encontrada');
    }



    // Hacer un merge profundo de los steps existentes con los nuevos datos
    const updatedSteps = { ...currentVerification.steps };

    Object.keys(stepsUpdate).forEach(stepKey => {
      const stepData = stepsUpdate[stepKey as keyof UpdateVerificationStepsDTO];
      const currentStepData = updatedSteps[stepKey as keyof typeof updatedSteps];

      if (stepData && typeof stepData === 'object') {
        // Merge el step actual con los nuevos datos
        const mergedData = Object.assign({}, currentStepData, stepData);
        updatedSteps[stepKey as keyof typeof updatedSteps] = mergedData as any;

      } else {
        updatedSteps[stepKey as keyof typeof updatedSteps] = stepData as any;
      }
    });



    // Actualizar con los steps completos y resetear estado a pending
    // Cuando se actualizan los pasos, el perfil debe volver a estado pendiente
    // para requerir aprobación manual del administrador
    const verification = await ProfileVerification.findByIdAndUpdate(
      verificationId,
      {
        $set: {
          steps: updatedSteps,
          verificationStatus: 'pending',
          verifiedAt: null,
          verificationFailedAt: null,
          verificationFailedReason: null
        }
      },
      { new: true, runValidators: true }
    ).lean();

    if (!verification) {
      throw new Error('Verificación no encontrada después de actualización');
    }



    // Recalcular progreso automáticamente
    await recalculateVerificationProgress(verification as unknown as IProfileVerification);

    // Retornar verificación actualizada
    const finalVerification = await ProfileVerification.findById(verificationId)
      .populate('profile', 'name user')
      .lean();



    return finalVerification;
  } catch (error) {

    throw new Error(`Error al actualizar pasos de verificación: ${error}`);
  }
};

// Actualizar estado de verificación
export const updateVerificationStatus = async (
  verificationId: string | Types.ObjectId,
  status: 'pending' | 'verified' | 'rejected',
  reason?: string
) => {
  try {
    const updateData: Partial<IProfileVerification> = {
      verificationStatus: status,
    };

    if (status === 'verified') {
      updateData.verifiedAt = new Date();
    } else if (status === 'rejected' && reason) {
      updateData.verificationFailedAt = new Date();
      updateData.verificationFailedReason = reason;
    }

    const verification = await ProfileVerification.findByIdAndUpdate(
      verificationId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('profile', 'name user')
      .lean();

    return verification;
  } catch (error) {
    throw new Error(`Error al actualizar estado de verificación: ${error}`);
  }
};

// Obtener todas las verificaciones con filtros
export const getAllProfileVerifications = async (filters: ProfileVerificationFiltersDTO) => {
  try {
    const { status, page = 1, limit = 10 } = filters;
    const query: any = {};

    if (status) {
      query.verificationStatus = status;
    }

    const skip = (page - 1) * limit;

    const [verifications, total] = await Promise.all([
      ProfileVerification.find(query)
        .populate('profile', 'name user')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ProfileVerification.countDocuments(query)
    ]);

    return {
      verifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    throw new Error(`Error al obtener verificaciones: ${error}`);
  }
};

// Eliminar verificación
export const deleteProfileVerification = async (verificationId: string | Types.ObjectId) => {
  try {
    const verification = await ProfileVerification.findByIdAndDelete(verificationId);
    return verification;
  } catch (error) {
    throw new Error(`Error al eliminar verificación: ${error}`);
  }
};