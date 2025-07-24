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

export const getProfiles = async (_req: Request, res: Response) => {
  const profiles = await service.getProfiles();
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
