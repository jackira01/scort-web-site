import { Router } from 'express';
import * as profileVerificationController from './profile-verification.controller';

const router = Router();

// Rutas para verificación de perfiles

// GET /api/profile-verification - Obtener todas las verificaciones (con filtros opcionales)
router.get('/', profileVerificationController.getAllProfileVerifications);

// GET /api/profile-verification/:id - Obtener verificación por ID
router.get('/:id', profileVerificationController.getProfileVerificationById);

// GET /api/profile-verification/profile/:profileId - Obtener verificación por ID de perfil
router.get('/profile/:profileId', profileVerificationController.getProfileVerificationByProfileId);

// POST /api/profile-verification - Crear nueva verificación
router.post('/', profileVerificationController.createProfileVerification);

// PUT /api/profile-verification/:id - Actualizar verificación completa
router.put('/:id', profileVerificationController.updateProfileVerification);

// PATCH /api/profile-verification/:id/status - Actualizar solo el estado de verificación
router.patch('/:id/status', profileVerificationController.updateVerificationStatus);

// PATCH /api/profile-verification/:id/steps - Actualizar pasos específicos de verificación
router.patch('/:id/steps', profileVerificationController.updateVerificationSteps);

// POST /api/profile-verification/:id/recalculate - Recalcular progreso de verificación
router.post('/:id/recalculate', profileVerificationController.recalculateProgress);

// DELETE /api/profile-verification/:id - Eliminar verificación
router.delete('/:id', profileVerificationController.deleteProfileVerification);

export default router;