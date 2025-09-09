import type { Request, Response } from 'express';
import UserModel from './User.model';
import * as userService from './user.service';
import { sendWelcomeEmail } from '../../utils/welcome-email.util';

export const CreateUserController = async (req: Request, res: Response) => {
  try {
    const user = await userService.createUser(req.body);
    
    // Enviar correo de bienvenida
    if (user.email) {
      try {
        await sendWelcomeEmail(user.email, user.name);
      } catch (emailError) {
        console.error('Error enviando correo de bienvenida:', emailError);
        // No fallar el registro por error de email
      }
    }
    
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validar que el ID sea válido
    if (!id) {
      return res.status(400).json({ mensaje: 'ID de usuario requerido' });
    }

    const user = await userService.getUserById(id);

    if (!user) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    res.json({
      _id: user._id,
      email: user.email,
      name: user.name,
      verificationDocument: user.verificationDocument,
      isVerified: user.isVerified,
      verification_in_progress: user.verification_in_progress,
      role: user.role,
    });
  } catch (error) {
    console.error('Error al obtener usuario por ID:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al obtener usuario',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

export const verifyUserController = async (req: Request, res: Response) => { };

export const authGoogleUserController = async (req: Request, res: Response) => {
  const { email, name } = req.body;
  if (!email) return res.status(400).json({ message: 'Email requerido' });

  // Buscar usuario por email
  let user = await userService.findUserByEmail(email);
  let isNewUser = false;
  
  if (!user) {
    user = await userService.createUser({ email, name });
    isNewUser = true;
  }
  
  // Enviar correo de bienvenida para nuevos usuarios
  if (isNewUser) {
    try {
      await sendWelcomeEmail(user.email, name);
    } catch (emailError) {
      console.error('Error enviando correo de bienvenida:', emailError);
      // No fallar el registro por error de email
    }
  }
  
  return res.json({
    _id: user._id,
    isVerified: user.isVerified,
    verification_in_progress: user.verification_in_progress,
    role: user.role,
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
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log(`🔄 Actualizando usuario ${id} con datos:`, updateData);

    // Validar que el ID sea válido
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario requerido'
      });
    }

    // Validar que hay datos para actualizar
    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron datos para actualizar'
      });
    }

    const user = await userService.updateUser(id, updateData);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    console.log(`✅ Usuario actualizado exitosamente:`, {
      id: user._id,
      isVerified: user.isVerified,
      updatedFields: Object.keys(updateData)
    });

    res.json({
      success: true,
      message: 'Usuario actualizado correctamente',
      _id: user._id,
      email: user.email,
      name: user.name,
      isVerified: user.isVerified,
      verification_in_progress: user.verification_in_progress,
      role: user.role,
      verificationDocument: user.verificationDocument
    });
  } catch (error) {
    console.error('❌ Error al actualizar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al actualizar usuario',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
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
  
  // Verificar si el usuario es administrador para incluir perfiles inactivos
  const includeInactive = (req as any).user?.role === 'admin' || false;
  
  const profiles = await userService.getUserProfiles(userId, includeInactive);
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
