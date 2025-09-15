import type { Request, Response } from 'express';
import UserModel from './User.model';
import * as userService from './user.service';
import { sendWelcomeEmail } from '../../utils/welcome-email.util';
import bcrypt from 'bcryptjs';

export const CreateUserController = async (req: Request, res: Response) => {
  try {
    const user = await userService.createUser(req.body);

    // Enviar correo de bienvenida
    if (user.email) {
      try {
        await sendWelcomeEmail(user.email, user.name);
      } catch (emailError) {
        // Error enviando correo de bienvenida
        // No fallar el registro por error de email
      }
    }

    res.status(201).json(user);
  } catch (error) {
    // Error creating user
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
      accountType: user.accountType,
      agencyInfo: user.agencyInfo,
    });
  } catch (error) {
    // Error al obtener usuario por ID
    res.status(500).json({
      mensaje: 'Error interno del servidor al obtener usuario',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Registro de usuario con email y contraseña
export const registerUserController = async (req: Request, res: Response) => {
  try {
    const { email, name, password } = req.body;

    // Validar datos requeridos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await userService.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una cuenta con este email'
      });
    }

    // Hashear la contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear el usuario
    const user = await userService.createUser({
      email,
      name: name || email.split('@')[0], // Usar parte del email si no hay nombre
      password: hashedPassword,
      providers: ['credentials'],
      hasPassword: true,
      emailVerified: new Date(), // En producción, esto debería ser null hasta verificar
    });

    // Enviar correo de bienvenida
    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (emailError) {
      // Error enviando correo de bienvenida
      // No fallar el registro por error de email
    }

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Error in registerUserController:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Login de usuario con email y contraseña
export const loginUserController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validar datos requeridos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    // Buscar usuario por email
    const user = await userService.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar si el usuario tiene contraseña configurada
    if (!user.hasPassword || !user.password) {
      return res.status(401).json({
        success: false,
        message: 'Esta cuenta no tiene contraseña configurada. Usa otro método de login.'
      });
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Actualizar último login
    await userService.updateUserLastLogin(user._id?.toString() || '');

    res.json({
      success: true,
      message: 'Login exitoso',
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified,
        verification_in_progress: user.verification_in_progress,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Error in loginUserController:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const verifyUserController = async (req: Request, res: Response) => { };

export const authGoogleUserController = async (req: Request, res: Response) => {
  const { email, name } = req.body;
  console.log('🔍 [AUTH-GOOGLE] Datos recibidos:', { email, name });

  if (!email) return res.status(400).json({ message: 'Email requerido' });

  // Buscar usuario por email
  let user = await userService.findUserByEmail(email);
  let isNewUser = false;

  console.log("user", user)

  console.log('🔍 [AUTH-GOOGLE] Usuario encontrado en BD:', {
    exists: !!user,
    userId: user?._id,
    email: user?.email,
    password: user?.password ? `[${typeof user.password}] ${user.password.length > 0 ? 'NO_EMPTY' : 'EMPTY'}` : 'undefined',
    providers: user?.providers
  });

  if (!user) {
    console.log('🔍 [AUTH-GOOGLE] Creando nuevo usuario...');
    user = await userService.createUser({
      email,
      name,
      providers: ['google'],
      hasPassword: false,
      emailVerified: new Date()
    });
    isNewUser = true;
    console.log('🔍 [AUTH-GOOGLE] Usuario creado:', {
      userId: user?._id,
      hasPassword: user?.hasPassword,
      password: user?.password ? `[${typeof user.password}] ${user.password.length > 0 ? 'NO_EMPTY' : 'EMPTY'}` : 'undefined'
    });
  } else {
    console.log('🔍 [AUTH-GOOGLE] Usuario existente, verificando providers...');
    // Usuario existe, agregar Google como provider si no lo tiene
    if (!user.providers.includes('google')) {
      console.log('🔍 [AUTH-GOOGLE] Agregando Google como provider...');
      user = await userService.updateUser(user._id?.toString() || '', {
        providers: [...user.providers, 'google'],
        emailVerified: user.emailVerified || new Date(),
        name: user.name || name,
      });
      console.log('🔍 [AUTH-GOOGLE] Usuario actualizado con Google provider');
    } else {
      console.log('🔍 [AUTH-GOOGLE] Usuario ya tiene Google como provider');
    }
  }

  // Verificar que user no sea null después de las operaciones
  if (!user) {
    console.log('❌ [AUTH-GOOGLE] Error: Usuario es null después de operaciones');
    return res.status(500).json({
      success: false,
      message: 'Error al procesar usuario'
    });
  }

  console.log('🔍 [AUTH-GOOGLE] Usuario final antes de respuesta:', {
    userId: user._id,
    email: user.email,
    name: user.name,
    isVerified: user.isVerified,
    verification_in_progress: user.verification_in_progress,
    role: user.role,
    hasPassword: user.hasPassword,
    password: user.password ? `[${typeof user.password}] ${user.password.length > 0 ? 'NO_EMPTY' : 'EMPTY'}` : 'undefined',
    providers: user.providers
  });

  // Enviar correo de bienvenida para nuevos usuarios
  if (isNewUser) {
    try {
      await sendWelcomeEmail(user.email, name);
      console.log('✅ [AUTH-GOOGLE] Correo de bienvenida enviado');
    } catch (emailError) {
      console.log('⚠️ [AUTH-GOOGLE] Error enviando correo de bienvenida:', emailError);
      // Error enviando correo de bienvenida
      // No fallar el registro por error de email
    }
  }

  const responseData = {
    success: true,
    userId: user._id,
    userEmail: user.email,
    userPassword: user.password || null, // Enviar null en lugar de undefined
    action: user.password ? 'login' : 'post_register', // Determinar acción basada en existencia de password
    actionReason: `password ${user.password ? 'exists' : 'does not exist'}`
  };

  console.log('📤 [AUTH-GOOGLE] Respuesta enviada al frontend:', {
    success: responseData.success,
    userId: responseData.userId,
    userEmail: responseData.userEmail,
    userPassword: responseData.userPassword === null ? 'null' : (responseData.userPassword ? `[${typeof responseData.userPassword}] ${responseData.userPassword.length > 0 ? 'NO_EMPTY' : 'EMPTY'}` : 'undefined'),
    action: responseData.action,
    actionReason: responseData.actionReason
  });

  return res.json(responseData);
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

    // Actualizando usuario con datos

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

    // Usuario actualizado exitosamente

    res.json({
      success: true,
      message: 'Usuario actualizado correctamente',
      _id: user._id,
      email: user.email,
      name: user.name,
      isVerified: user.isVerified,
      verification_in_progress: user.verification_in_progress,
      role: user.role,
      accountType: user.accountType,
      verificationDocument: user.verificationDocument
    });
  } catch (error) {
    // Error al actualizar usuario
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

// Configurar contraseña después del registro con Google (post-register)
export const setPasswordAfterGoogleRegisterController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validar datos requeridos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    // Buscar usuario por email
    const user = await userService.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar que el usuario no tenga contraseña configurada
    if (user.hasPassword) {
      return res.status(400).json({
        success: false,
        message: 'Este usuario ya tiene una contraseña configurada'
      });
    }

    // Hashear la contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Actualizar el usuario con la nueva contraseña
    const updatedUser = await userService.updateUser(user._id?.toString() || '', {
      password: hashedPassword,
      hasPassword: true,
      providers: user.providers.includes('credentials')
        ? user.providers
        : [...user.providers, 'credentials']
    });

    if (!updatedUser) {
      return res.status(500).json({
        success: false,
        message: 'Error al actualizar usuario'
      });
    }

    res.json({
      success: true,
      message: 'Contraseña configurada exitosamente',
      user: {
        _id: updatedUser._id,
        email: updatedUser.email,
        name: updatedUser.name,
        isVerified: updatedUser.isVerified,
        verification_in_progress: updatedUser.verification_in_progress,
        role: updatedUser.role,
        hasPassword: updatedUser.hasPassword,
      }
    });
  } catch (error) {
    console.error('Error in setPasswordAfterGoogleRegisterController:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
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
