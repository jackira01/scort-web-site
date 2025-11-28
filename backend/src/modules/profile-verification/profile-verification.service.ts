import ProfileVerification from './profile-verification.model';
import type { IProfileVerification } from '../profile/profile.types';
import type { Types } from 'mongoose';
import { type IUser } from '../user/User.model';
import { ProfileModel } from '../profile/profile.model';
import type { IProfile } from '../profile/profile.types';
import { enrichProfileVerification } from './verification.helper';
import {
  CreateProfileVerificationDTO,
  UpdateProfileVerificationDTO,
  UpdateVerificationStatusDTO,
  UpdateVerificationStepsDTO,
  ProfileVerificationFiltersDTO
} from './profile-verification.types';
import { calculateVerificationProgress } from './verification-progress.utils';
import { calculatePhoneChangeStatus } from './phone-verification.utils';
import { ConfigParameterService } from '../config-parameter/config-parameter.service';

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

// Función para obtener steps por defecto
const getDefaultVerificationSteps = (accountType: string, requiresIndependentVerification: boolean, lastLoginVerified: boolean, userLastLoginDate: Date | null) => {
  const baseSteps = {
    frontPhotoVerification: {
      photo: undefined,
      isVerified: false
    },
    selfieVerification: {
      photo: undefined,
      isVerified: false
    },
    mediaVerification: {
      mediaLink: undefined,
      mediaType: undefined,
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

  if (accountType === 'common' && !requiresIndependentVerification) {
    return {
      ...baseSteps,
      frontPhotoVerification: {
        photo: undefined,
        isVerified: false
      },
      selfieVerification: {
        photo: undefined,
        isVerified: false
      }
    };
  }

  return baseSteps;
};

// Función auxiliar para recalcular el progreso de verificación
const recalculateVerificationProgress = async (verification: IProfileVerification) => {
  try {
    const populatedVerification = await ProfileVerification.findById(verification._id)
      .populate({
        path: 'profile',
        select: 'name user createdAt contact',
        populate: {
          path: 'user',
          select: 'accountType lastLogin'
        }
      })
      .lean() as unknown as IProfileVerificationWithPopulatedProfile | null;

    if (!populatedVerification?.profile) {
      return verification.verificationProgress;
    }

    const minAgeMonths = await ConfigParameterService.getValue('profile.verification.minimum_age_months') || 12;

    const newProgress = calculateVerificationProgress(
      populatedVerification as unknown as IProfileVerification,
      populatedVerification.profile.user,
      populatedVerification.profile as unknown as IProfile,
      Number(minAgeMonths)
    );

    await ProfileVerification.findByIdAndUpdate(
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
    console.group('🔍 DEBUG: getProfileVerificationByProfileId');
    console.log('Profile ID:', profileId);

    const verification = await ProfileVerification.findOne({ profile: profileId })
      .populate({
        path: 'profile',
        select: 'name user createdAt contact',
        populate: {
          path: 'user',
          select: 'accountType lastLogin'
        }
      })
      .lean();

    console.log('Found Verification:', !!verification);

    if (verification && verification.profile) {
      const minAgeMonths = await ConfigParameterService.getValue('profile.verification.minimum_age_months') || 12;

      // 1. Obtenemos SOLO los datos dinámicos del helper
      const enrichedProfile = enrichProfileVerification(verification.profile as any, Number(minAgeMonths));

      if (enrichedProfile.verification) {
        // 2. Fusionamos los pasos dinámicos con los pasos estáticos de la base de datos
        // Esto asegura que el frontend vea los checks verdes en antigüedad y contacto
        if (enrichedProfile.verification.steps) {
          verification.steps = {
            ...verification.steps,
            accountAge: enrichedProfile.verification.steps.accountAge,
            contactConsistency: enrichedProfile.verification.steps.contactConsistency,
            phoneChangeDetected: enrichedProfile.verification.steps.phoneChangeDetected
          };
        }

        // 3. CORRECCIÓN PRINCIPAL:
        // No copiamos el verificationProgress del enrichedProfile (que viene incompleto).
        // En su lugar, recalculamos usando el objeto 'verification' completo que ya tiene las fotos fusionadas.

        console.log('🔄 Recalculating Full Progress in Service...');
        const fullProgress = calculateVerificationProgress(
          verification as any,
          (verification.profile as any)?.user,
          verification.profile as any,
          Number(minAgeMonths)
        );

        console.log('Syncing Progress:', {
          old: verification.verificationProgress,
          helperPartial: enrichedProfile.verification.verificationProgress, // El que daba 29%
          newCorrect: fullProgress // El que debería dar 100%
        });

        verification.verificationProgress = fullProgress;
      }
    }
    console.groupEnd();

    return verification;
  } catch (error) {
    console.error('Error in getProfileVerificationByProfileId:', error);
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
    let userLastLoginDate = null;
    let lastLoginVerified = true;
    let accountType = 'common';
    let requiresIndependentVerification = false;

    if (verificationData.profile) {
      const profile = await ProfileModel.findById(verificationData.profile).populate('user') as unknown as IProfileWithUser | null;
      if (profile && profile.user) {
        accountType = profile.user.accountType || 'common';

        if (profile.user.lastLogin?.date) {
          userLastLoginDate = profile.user.lastLogin.date;
          lastLoginVerified = true;
        }

        if (accountType === 'agency') {
          const userId = (profile.user as any)._id || (profile.user as any).id;
          requiresIndependentVerification = await shouldRequireIndependentVerification(userId, verificationData.profile);
        }
      }
    }

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

    if (isUpdatingSteps) {
      await recalculateVerificationProgress(verification as unknown as IProfileVerification);

      const updatedVerification = await ProfileVerification.findById(verificationId)
        .populate({
          path: 'profile',
          select: 'name user createdAt contact',
          populate: {
            path: 'user',
            select: 'accountType lastLogin'
          }
        })
        .lean();

      if (updatedVerification && updatedVerification.profile) {
        const minAgeMonths = await ConfigParameterService.getValue('profile.verification.minimum_age_months') || 12;
        const enrichedProfile = enrichProfileVerification(updatedVerification.profile as any, Number(minAgeMonths));
        if (enrichedProfile.verification?.steps) {
          updatedVerification.steps = {
            ...updatedVerification.steps,
            accountAge: enrichedProfile.verification.steps.accountAge,
            contactConsistency: enrichedProfile.verification.steps.contactConsistency,
            phoneChangeDetected: enrichedProfile.verification.steps.phoneChangeDetected
          };
        }
      }

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
    const currentVerification = await ProfileVerification.findById(verificationId).lean();
    if (!currentVerification) {
      throw new Error('Verificación no encontrada');
    }

    const updatedSteps = { ...currentVerification.steps };

    Object.keys(stepsUpdate).forEach(stepKey => {
      const stepData = stepsUpdate[stepKey as keyof UpdateVerificationStepsDTO];
      const currentStepData = updatedSteps[stepKey as keyof typeof updatedSteps];

      if (stepData && typeof stepData === 'object') {
        const mergedData = Object.assign({}, currentStepData, stepData);
        updatedSteps[stepKey as keyof typeof updatedSteps] = mergedData as any;

      } else {
        updatedSteps[stepKey as keyof typeof updatedSteps] = stepData as any;
      }
    });

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

    await recalculateVerificationProgress(verification as unknown as IProfileVerification);

    const finalVerification = await ProfileVerification.findById(verificationId)
      .populate({
        path: 'profile',
        select: 'name user createdAt contact',
        populate: {
          path: 'user',
          select: 'accountType lastLogin'
        }
      })
      .lean();

    if (finalVerification && finalVerification.profile) {
      const minAgeMonths = await ConfigParameterService.getValue('profile.verification.minimum_age_months') || 12;
      const enrichedProfile = enrichProfileVerification(finalVerification.profile as any, Number(minAgeMonths));
      if (enrichedProfile.verification?.steps) {
        finalVerification.steps = {
          ...finalVerification.steps,
          accountAge: enrichedProfile.verification.steps.accountAge,
          contactConsistency: enrichedProfile.verification.steps.contactConsistency,
          phoneChangeDetected: enrichedProfile.verification.steps.phoneChangeDetected
        };
      }
    }

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

// Actualiza el estado de phoneChangeDetected para un perfil
export const updatePhoneChangeDetectionStatus = async (profile: IProfile): Promise<void> => {
  try {
    const verification = await ProfileVerification.findOne({ profile: profile._id });

    if (!verification) {
      console.warn(`No se encontró verificación para el perfil ${profile._id}`);
      return;
    }

    const phoneChangeDetected = await calculatePhoneChangeStatus(profile);

    const updatedVerification = await ProfileVerification.findByIdAndUpdate(
      verification._id,
      {
        $set: {
          'steps.phoneChangeDetected': phoneChangeDetected
        }
      },
      { new: true }
    );

    if (updatedVerification) {
      await recalculateVerificationProgress(updatedVerification as unknown as IProfileVerification);
    }

    console.log(`✅ Estado de phoneChangeDetected actualizado para perfil ${profile._id}: ${phoneChangeDetected}`);

  } catch (error) {
    console.error('Error al actualizar phoneChangeDetected:', error);
    throw error;
  }
};