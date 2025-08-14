import ProfileVerification from './profile-verification.model';
import type { IProfileVerification } from '../profile/profile.types';
import type { Types } from 'mongoose';
import UserModel from '../user/User.model';
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
      .lean();

    if (!populatedVerification?.profile) {

      return verification.verificationProgress;
    }

    const user = (populatedVerification.profile as any)?.user;
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
      .populate('profile', 'name user')
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
    // Inicializar steps con valores por defecto
    const defaultSteps = {
      documentPhotos: {
        documents: [],
        isVerified: false
      },
      selfieWithPoster: {
        photo: undefined,
        isVerified: false
      },
      selfieWithDoc: {
        photo: undefined,
        isVerified: false
      },
      fullBodyPhotos: {
        photos: [],
        isVerified: false
      },
      video: {
        videoLink: undefined,
        isVerified: false
      },
      videoCallRequested: {
        videoLink: undefined,
        isVerified: false
      },
      socialMedia: {
        accounts: [],
        isVerified: false
      },
      phoneChangeDetected: false,
      lastLogin: {
        isVerified: false,
        date: null
      }
    };

    const verificationWithDefaults = {
      ...verificationData,
      steps: defaultSteps,
      verificationProgress: 0
    };

    const verification = new ProfileVerification(verificationWithDefaults);
    await verification.save();
    
    return await ProfileVerification.findById(verification._id)
      .populate('profile', 'name user')
      .lean();
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
      await recalculateVerificationProgress(verification);
      
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
    

    
    // Actualizar con los steps completos
    const verification = await ProfileVerification.findByIdAndUpdate(
      verificationId,
      { $set: { steps: updatedSteps } },
      { new: true, runValidators: true }
    ).lean();

    if (!verification) {
      throw new Error('Verificación no encontrada después de actualización');
    }
    


    // Recalcular progreso automáticamente
    await recalculateVerificationProgress(verification);
    
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