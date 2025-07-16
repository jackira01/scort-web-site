import type { Request, Response } from 'express';
import * as userService from './user.service';

export const CreateUserController = async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  res.status(201).json(user);
};
/* 
export const obtenerPerfiles = async (_: Request, res: Response) => {
  const perfiles = await userService.obtenerPerfiles();
  res.json(perfiles);
};

export const obtenerPerfilPorId = async (req: Request, res: Response) => {
  const perfil = await userService.obtenerPerfilPorId(req.params.id);
  if (!perfil) return res.status(404).json({ mensaje: 'Perfil no encontrado' });
  res.json(perfil);
};

export const actualizarPerfil = async (req: Request, res: Response) => {
  const perfil = await userService.actualizarPerfil(req.params.id, req.body);
  res.json(perfil);
};

export const eliminarPerfil = async (req: Request, res: Response) => {
  await userService.eliminarPerfil(req.params.id);
  res.status(204).send();
}; */

export const authGoogleUserController = async (req: Request, res: Response) => {
  const { email, name } = req.body;
  if (!email) return res.status(400).json({ message: 'Email requerido' });

  // Buscar usuario por email
  let user = await userService.findUserByEmail(email);
  if (!user) {
    user = await userService.createUser({ email, name });
  }
  return res.json(user);
};

export const verifyUserController = async (req: Request, res: Response) => { };

export const uploadUserDocumentController = async (req: Request, res: Response) => {
  const { userId, documentsUrl } = req.body;
  if (!userId || documentsUrl) {
    return res.status(400).json({ message: 'Faltan datos requeridos' });
  }

  try {
    const documentUrl = await userService.uploadUserDocument(userId, documentsUrl);
    return res.json({ documentUrl });
  } catch (error) {
    return res.status(500).json({ message: 'Error al subir el documento', error });
  }
};