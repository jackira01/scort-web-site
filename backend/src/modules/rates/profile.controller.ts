import type { Request, Response } from 'express';
import * as profileService from './profile.service';

export const crearPerfil = async (req: Request, res: Response) => {
  const perfil = await profileService.crearPerfil(req.body);
  res.status(201).json(perfil);
};

export const obtenerPerfiles = async (_: Request, res: Response) => {
  const perfiles = await profileService.obtenerPerfiles();
  res.json(perfiles);
};

export const obtenerPerfilPorId = async (req: Request, res: Response) => {
  const perfil = await profileService.obtenerPerfilPorId(req.params.id);
  if (!perfil) return res.status(404).json({ mensaje: 'Perfil no encontrado' });
  res.json(perfil);
};

export const actualizarPerfil = async (req: Request, res: Response) => {
  const perfil = await profileService.actualizarPerfil(req.params.id, req.body);
  res.json(perfil);
};

export const eliminarPerfil = async (req: Request, res: Response) => {
  await profileService.eliminarPerfil(req.params.id);
  res.status(204).send();
};
