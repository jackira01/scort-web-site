import type { Request, Response } from 'express';
import UserModel from './User.model';
import * as userService from './user.service';
import { sendWelcomeEmail } from '../../utils/welcome-email.util';
import bcrypt from 'bcryptjs';
import EmailService from '../../services/email.service';

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

// Verificar código de recuperación de contraseña
export const verifyPasswordResetCodeController = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    // Validar datos requeridos
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email y código son requeridos'
      });
    }

    // Buscar usuario por email
    const user = await userService.findUserByEmail(email);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Código inválido o expirado'
      });
    }

    // Verificar si el código existe y no ha expirado
    if (!user.resetPasswordCode || !user.resetPasswordExpires) {
      return res.status(400).json({
        success: false,
        message: 'Código inválido o expirado'
      });
    }

    // Verificar si el código ha expirado
    if (new Date() > user.resetPasswordExpires) {
      // Limpiar código expirado
      await UserModel.findByIdAndUpdate(user._id, {
        $unset: { resetPasswordCode: 1, resetPasswordExpires: 1 }
      });

      return res.status(400).json({
        success: false,
        message: 'Código inválido o expirado'
      });
    }

    // Verificar si el código coincide
    if (user.resetPasswordCode !== code) {
      return res.status(400).json({
        success: false,
        message: 'Código inválido o expirado'
      });
    }

    // Código válido - generar token temporal para cambio de contraseña
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Guardar token temporal con expiración de 10 minutos
    const tokenExpiration = new Date(Date.now() + 10 * 60 * 1000);

    await UserModel.findByIdAndUpdate(user._id, {
      resetPasswordToken: resetToken,
      resetPasswordTokenExpires: tokenExpiration,
      $unset: { resetPasswordCode: 1, resetPasswordExpires: 1 }
    });

    res.json({
      success: true,
      message: 'Código verificado correctamente',
      resetToken: resetToken
    });

  } catch (error) {
    console.error('Error en verificación de código:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Controlador para restablecer contraseña con token
export const resetPasswordController = async (req: Request, res: Response) => {
  try {
    const { email, token, newPassword } = req.body;

    // Validar datos de entrada
    if (!email || !token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, token y nueva contraseña son requeridos'
      });
    }

    // Validar formato de contraseña
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número'
      });
    }

    // Buscar usuario por email
    const user = await userService.findUserByEmail(email);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token de restablecimiento inválido'
      });
    }

    // Verificar token y expiración
    if (!user.resetPasswordToken ||
      !user.resetPasswordTokenExpires ||
      user.resetPasswordToken !== token ||
      user.resetPasswordTokenExpires < new Date()) {

      // Limpiar campos expirados
      if (user.resetPasswordTokenExpires && user.resetPasswordTokenExpires < new Date()) {
        await UserModel.findByIdAndUpdate(user._id, {
          $unset: { resetPasswordToken: 1, resetPasswordTokenExpires: 1 }
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Token de restablecimiento inválido o expirado'
      });
    }

    // Encriptar nueva contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña y limpiar tokens de restablecimiento
    await UserModel.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      hasPassword: true,
      $unset: {
        resetPasswordToken: 1,
        resetPasswordTokenExpires: 1,
        resetPasswordCode: 1,
        resetPasswordExpires: 1
      }
    });

    res.status(200).json({
      success: true,
      message: 'Contraseña restablecida exitosamente'
    });

  } catch (error) {
    console.error('Error en resetPasswordController:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
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
      hasPassword: user.hasPassword, // Agregar hasPassword para el callback JWT
      emailVerified: user.emailVerified,
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

    // Normalizar email a minúsculas
    const normalizedEmail = email.toLowerCase().trim();

    // Verificar si el usuario ya existe
    const existingUser = await userService.findUserByEmail(normalizedEmail);
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
      email: normalizedEmail,
      name: name || normalizedEmail.split('@')[0], // Usar parte del email si no hay nombre
      password: hashedPassword,
      providers: ['credentials'],
      hasPassword: true,
      emailVerified: null, // No verificado hasta que confirme el email
    });

    // Enviar código de verificación por email
    try {
      const { EmailVerificationService } = await import('./email-verification.service');
      const emailVerificationService = new EmailVerificationService();
      await emailVerificationService.sendVerificationCode(user.email, user.name);
    } catch (emailError) {
      console.error('Error enviando código de verificación:', emailError);
      // No fallar el registro por error de email, pero informar al usuario
    }

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente. Revisa tu email para verificar tu cuenta.',
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified,
        role: user.role,
        emailVerified: user.emailVerified,
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

    // Normalizar email a minúsculas
    const normalizedEmail = email.toLowerCase().trim();

    // Buscar usuario por email
    const user = await userService.findUserByEmail(normalizedEmail);
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
        emailVerified: user.emailVerified,
        hasPassword: user.hasPassword,
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

// Solicitar recuperación de contraseña
export const requestPasswordResetController = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Validar que se proporcione el email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico es requerido'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'El formato del correo electrónico no es válido'
      });
    }

    // Buscar usuario por email
    const user = await userService.findUserByEmail(email);

    // Por seguridad, siempre devolvemos el mismo mensaje
    // independientemente de si el usuario existe o no
    if (user) {
      // Generar código de recuperación de 6 dígitos
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Guardar el código en el usuario con expiración de 15 minutos
      const expirationTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

      await UserModel.findByIdAndUpdate(user._id, {
        resetPasswordCode: resetCode,
        resetPasswordExpires: expirationTime
      });

      // Enviar código por email usando el servicio de email
      try {
        const EmailService = require('../../services/email.service').default;
        const emailService = new EmailService();

        const emailResult = await emailService.sendSingleEmail({
          to: { email: email },
          content: {
            subject: 'Código de Recuperación de Contraseña',
            textPart: `
Tu código de recuperación de contraseña es: ${resetCode}

Este código expirará en 15 minutos.

Si no solicitaste este código, puedes ignorar este correo.
            `,
            htmlPart: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                  <h2 style="color: #333; margin-bottom: 20px; text-align: center;">🔐 Recuperación de Contraseña</h2>
                  
                  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px; text-align: center;">
                    <p style="color: #495057; margin-bottom: 10px;">Tu código de recuperación es:</p>
                    <div style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 4px; margin: 20px 0;">${resetCode}</div>
                  </div>
                  
                  <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
                    <p style="color: #856404; margin: 0; font-size: 14px;">⏰ Este código expirará en <strong>15 minutos</strong></p>
                  </div>
                  
                  <div style="text-align: center; margin-top: 20px;">
                    <p style="color: #666; font-size: 14px;">Si no solicitaste este código, puedes ignorar este correo.</p>
                  </div>
                </div>
              </div>
            `
          }
        });

        if (!emailResult.success) {
          console.error('Error enviando código de recuperación:', emailResult.error);
          // Loguear el código para desarrollo si falla el email
          console.log(`Código de recuperación para ${email}: ${resetCode}`);
        }
      } catch (emailError) {
        console.error('Error enviando código de recuperación:', emailError);
        // Loguear el código para desarrollo si falla el email
        console.log(`Código de recuperación para ${email}: ${resetCode}`);
      }
    }

    // Siempre devolver el mismo mensaje por seguridad
    res.json({
      success: true,
      message: 'Si el correo existe en nuestra base de datos, se te enviará un código de verificación'
    });

  } catch (error) {
    console.error('Error en solicitud de recuperación de contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const verifyUserController = async (req: Request, res: Response) => { };

export const authGoogleUserController = async (req: Request, res: Response) => {
  const { email, name } = req.body;

  if (!email) return res.status(400).json({ message: 'Email requerido' });

  // Normalizar email a minúsculas
  const normalizedEmail = email.toLowerCase().trim();

  // Buscar usuario por email
  let user = await userService.findUserByEmail(normalizedEmail);
  let isNewUser = false;

  if (!user) {
    user = await userService.createUser({
      email: normalizedEmail,
      name,
      providers: ['google'],
      hasPassword: false,
      emailVerified: new Date()
    });
    isNewUser = true;
  } else {
    // Usuario existe, agregar Google como provider si no lo tiene
    if (!user.providers.includes('google')) {
      user = await userService.updateUser(user._id?.toString() || '', {
        providers: [...user.providers, 'google'],
        emailVerified: user.emailVerified || new Date(),
        name: user.name || name,
      });
    }
  }

  // Verificar que user no sea null después de las operaciones
  if (!user) {
    return res.status(500).json({
      success: false,
      message: 'Error al procesar usuario'
    });
  }

  // Enviar correo de bienvenida para nuevos usuarios
  if (isNewUser) {
    try {
      await sendWelcomeEmail(user.email, name);
    } catch (emailError) {
      // Error enviando correo de bienvenida
      // No fallar el registro por error de email
    }
  }

  return res.json({
    success: true,
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
      isVerified: user.isVerified,
      verification_in_progress: user.verification_in_progress,
      role: user.role,
      hasPassword: user.hasPassword,
      emailVerified: user.emailVerified,
    }
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

    // Si se actualizaron documentos de verificación, enviar notificación por email
    if (updateData.verification_in_progress === true && updateData.verificationDocument) {
      try {
        const emailService = new EmailService();
        await emailService.sendUserVerificationUpdateNotification(
          user.name || 'Usuario',
          user.email,
          user._id?.toString() || ''
        );
        // Email de notificación enviado exitosamente
      } catch (emailError) {
        // Error al enviar email de notificación, pero no fallar la actualización
        console.error('Error al enviar notificación de verificación:', emailError);
      }
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
    populate: {
      path: 'profiles',
      select: '_id user name age location verification media planAssignment upgrades socialMedia visible isActive',
      populate: {
        path: 'verification',
        model: 'ProfileVerification',
        select: 'verificationProgress verificationStatus'
      }
    }
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

/**
 * Eliminar usuario y todos sus datos relacionados
 * Solo accesible para administradores
 */
export const deleteUserController = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    // Validar que el ID esté presente
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario requerido'
      });
    }

    // Verificar que el usuario autenticado sea administrador
    const currentUser = (req as any).user;
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    // Evitar que un admin se elimine a sí mismo
    if (currentUser.id === userId || currentUser._id === userId) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propia cuenta de administrador'
      });
    }

    // Eliminar usuario y todos sus datos relacionados
    const result = await userService.deleteUserCompletely(userId);

    res.json(result);
  } catch (error: any) {
    console.error('❌ Error al eliminar usuario:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al eliminar el usuario'
    });
  }
};

/* 
export const obtenerPerfiles = async (_: Request, res: Response) => {
  const perfiles = await userService.obtenerPerfiles();
  res.json(perfiles);
};




export const eliminarPerfil = async (req: Request, res: Response) => {
  await userService.eliminarPerfil(req.params.id);
  res.status(204).send();
}; */
