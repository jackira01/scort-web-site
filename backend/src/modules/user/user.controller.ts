import type { Request, Response } from 'express';
import UserModel from './User.model';
import * as userService from './user.service';

export const CreateUserController = async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  res.status(201).json(user);
};

export const getUserById = async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.params.id);

  if (!user) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
  res.json({
    _id: user._id,
    email: user.email,
    name: user.name,
    verificationDocument: user.verificationDocument,
    isVerified: user.isVerified,
    verification_in_progress: user.verification_in_progress,
  });
};

export const verifyUserController = async (req: Request, res: Response) => { };

export const authGoogleUserController = async (req: Request, res: Response) => {
  const { email, name } = req.body;
  if (!email) return res.status(400).json({ message: 'Email requerido' });

  // Buscar usuario por email
  let user = await userService.findUserByEmail(email);
  if (!user) {
    user = await userService.createUser({ email, name });
  }
  return res.json({
    _id: user._id,
    isVerified: user.isVerified,
    verification_in_progress: user.verification_in_progress,
  });
};

export const uploadUserDocumentController = async (
  req: Request,
  res: Response,
) => {
  const { userId, documentsUrl } = req.body;
  if (!userId || documentsUrl) {
    return res.status(400).json({ message: 'Faltan datos requeridos' });
  }

  try {
    const documentUrl = await userService.uploadUserDocument(
      userId,
      documentsUrl,
    );
    return res.json({ documentUrl });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Error al subir el documento', error });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const user = await userService.updateUser(req.params.id, req.body);
  res.json(user);
};

export const getUsers = async (req: Request, res: Response) => {
  const { page, limit } = req.query;
  const filters = req.body;

  if (!page || !limit) {
    return res.status(400).json({ message: 'Faltan datos' });
  }

  const options = {
    page: Number(page),
    limit: Number(limit),
    sort: { createdAt: -1 },
  };

  try {
    const getUsers = await userService.getUsers(filters, options);
    // Debug: getUsers

    return res.status(200).json(getUsers);
  } catch (error) {
    // Error occurred
    res.status(500).json({ message: error });
  }
};

// Actualizar lastLogin del usuario
export const updateUserLastLogin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await userService.updateUserLastLogin(id);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.json({
      success: true,
      message: 'LastLogin actualizado correctamente',
      data: {
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: `Error al actualizar lastLogin: ${error}` 
    });
  }
};

export const getUserProfiles = async (req: Request, res: Response) => {
  const userId = req.params.id;
  const profiles = await userService.getUserProfiles(userId);
  res.json(profiles);
}

/* 
export const obtenerPerfiles = async (_: Request, res: Response) => {
  const perfiles = await userService.obtenerPerfiles();
  res.json(perfiles);
};




export const eliminarPerfil = async (req: Request, res: Response) => {
  await userService.eliminarPerfil(req.params.id);
  res.status(204).send();
}; */
