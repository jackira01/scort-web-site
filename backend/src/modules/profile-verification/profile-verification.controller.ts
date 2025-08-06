import type { Request, Response } from 'express';
import * as profileVerificationService from './profile-verification.service';
import { Types } from 'mongoose';
import {
  CreateProfileVerificationDTO,
  UpdateProfileVerificationDTO,
  UpdateVerificationStatusDTO,
  UpdateVerificationStepsDTO,
  ProfileVerificationFiltersDTO
} from './profile-verification.types';

// Obtener verificación por ID de perfil
export const getProfileVerificationByProfileId = async (req: Request, res: Response) => {
  try {
    const { profileId } = req.params;
    
    if (!profileId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID del perfil es requerido' 
      });
    }

    const verification = await profileVerificationService.getProfileVerificationByProfileId(profileId);
    
    if (!verification) {
      return res.status(404).json({ 
        success: false, 
        message: 'Verificación no encontrada para este perfil' 
      });
    }

    res.status(200).json({
      success: true,
      data: verification
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: errorMessage 
    });
  }
};

// Obtener verificación por ID
export const getProfileVerificationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de verificación es requerido' 
      });
    }

    const verification = await profileVerificationService.getProfileVerificationById(id);
    
    if (!verification) {
      return res.status(404).json({ 
        success: false, 
        message: 'Verificación no encontrada' 
      });
    }

    res.status(200).json({
      success: true,
      data: verification
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: errorMessage 
    });
  }
};

// Crear nueva verificación
export const createProfileVerification = async (req: Request, res: Response) => {
  try {
    const verificationData: CreateProfileVerificationDTO = req.body;
    
    if (!verificationData.profile) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID del perfil es requerido' 
      });
    }

    const verification = await profileVerificationService.createProfileVerification(verificationData);
    
    res.status(201).json({
      success: true,
      data: verification,
      message: 'Verificación creada exitosamente'
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: errorMessage 
    });
  }
};

// Actualizar verificación
export const updateProfileVerification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: UpdateProfileVerificationDTO = req.body;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de verificación es requerido' 
      });
    }

    const verification = await profileVerificationService.updateProfileVerification(id, updateData);
    
    if (!verification) {
      return res.status(404).json({ 
        success: false, 
        message: 'Verificación no encontrada' 
      });
    }

    res.status(200).json({
      success: true,
      data: verification,
      message: 'Verificación actualizada exitosamente'
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: errorMessage 
    });
  }
};

// Actualizar estado de verificación
export const updateVerificationStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reason }: UpdateVerificationStatusDTO = req.body;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de verificación es requerido' 
      });
    }

    if (!status || !['pending', 'verified', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Estado de verificación inválido. Debe ser: pending, verified o rejected' 
      });
    }

    const verification = await profileVerificationService.updateVerificationStatus(id, status, reason);
    
    if (!verification) {
      return res.status(404).json({ 
        success: false, 
        message: 'Verificación no encontrada' 
      });
    }

    res.status(200).json({
      success: true,
      data: verification,
      message: `Estado de verificación actualizado a: ${status}`
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: errorMessage 
    });
  }
};

// Obtener todas las verificaciones
export const getAllProfileVerifications = async (req: Request, res: Response) => {
  try {
    const { status, page, limit } = req.query;
    
    const filters: ProfileVerificationFiltersDTO = {
      status: status as 'pending' | 'verified' | 'rejected' | undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10
    };

    const result = await profileVerificationService.getAllProfileVerifications(filters);
    
    res.status(200).json({
      success: true,
      data: result.verifications,
      pagination: result.pagination
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: errorMessage 
    });
  }
};

// Eliminar verificación
export const deleteProfileVerification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de verificación es requerido' 
      });
    }

    const verification = await profileVerificationService.deleteProfileVerification(id);
    
    if (!verification) {
      return res.status(404).json({ 
        success: false, 
        message: 'Verificación no encontrada' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Verificación eliminada exitosamente'
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: errorMessage 
    });
  }
};

// Actualizar pasos específicos de verificación
export const updateVerificationSteps = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const stepsData: UpdateVerificationStepsDTO = req.body;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'ID de verificación es requerido'
      });
      return;
    }

    if (!stepsData || Object.keys(stepsData).length === 0) {
      res.status(400).json({
        success: false,
        message: 'Datos de pasos de verificación son requeridos'
      });
      return;
    }

    const updatedVerification = await profileVerificationService.updateVerificationSteps(id, stepsData);

    if (!updatedVerification) {
      res.status(404).json({
        success: false,
        message: 'Verificación no encontrada'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: updatedVerification,
      message: 'Pasos de verificación actualizados y progreso recalculado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar pasos de verificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Recalcular progreso de verificación manualmente
export const recalculateProgress = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de verificación es requerido' 
      });
    }

    // Obtener verificación actual
    const currentVerification = await profileVerificationService.getProfileVerificationById(id);
    
    if (!currentVerification) {
      return res.status(404).json({ 
        success: false, 
        message: 'Verificación no encontrada' 
      });
    }

    // Recalcular progreso sin actualizar pasos
    const verification = await profileVerificationService.updateVerificationSteps(id, currentVerification.steps as UpdateVerificationStepsDTO);
    
    res.status(200).json({
      success: true,
      data: verification,
      message: 'Progreso de verificación recalculado exitosamente'
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: errorMessage 
    });
  }
};