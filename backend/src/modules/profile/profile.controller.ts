import type { Request, Response } from 'express';
import * as service from './profile.service';

export const createProfile = async (req: Request, res: Response) => {
  try {
    const newProfile = await service.createProfile(req.body);
    res.status(201).json(newProfile);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred';
    res.status(400).json({ message });
  }
};

export const getProfiles = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const fields = req.query.fields as string;
  
  const profiles = await service.getProfiles(page, limit, fields);
  res.json(profiles);
};

export const getProfileById = async (req: Request, res: Response) => {
  const profile = await service.getProfileById(req.params.id);
  if (!profile)
    return res.status(404).json({ message: 'Perfil no encontrado' });
  res.json(profile);
};

export const updateProfile = async (req: Request, res: Response) => {
  const updated = await service.updateProfile(req.params.id, req.body);
  res.json(updated);
};

export const deleteProfile = async (req: Request, res: Response) => {
  await service.deleteProfile(req.params.id);
  res.status(204).send();
};

export const getProfilesPost = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, fields } = req.body;
    
    // Convertir a números para asegurar tipos correctos
    const pageNum = Number(page);
    const limitNum = Number(limit);
    
    const profiles = await service.getProfiles(pageNum, limitNum, fields);
    res.json(profiles);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred';
    res.status(400).json({ message });
  }
};

export const verifyProfileName = async (req: Request, res: Response) => {
  try {
    // Debug: req.query
    const { profileName } = req.query;
    const profile = await service.checkProfileNameExists(profileName as string);
    res.status(200).send(profile);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred';
    res.status(400).json({ message });
  }
};

export const createMissingVerifications = async (req: Request, res: Response) => {
  try {
    const result = await service.createMissingVerifications();
    res.status(200).json({
      success: true,
      message: `Proceso completado. ${result.created} verificaciones creadas, ${result.errors} errores.`,
      data: result
    });
  } catch (err: unknown) {
     const message = err instanceof Error ? err.message : 'An error occurred';
     res.status(500).json({ 
       success: false,
       message: `Error al crear verificaciones faltantes: ${message}` 
     });
   }
 };

export const getProfilesWithStories = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const profiles = await service.getProfilesWithStories(page, limit);
    res.json(profiles);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred';
    res.status(500).json({ message });
  }
};