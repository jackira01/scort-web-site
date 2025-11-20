import { z } from 'zod';

// Tipos para manejo de cuentas
export interface UserAccount {
  id: string;
  email: string;
  name?: string;
  image?: string;
  hasPassword: boolean;
  providers: ('credentials' | 'google')[];
  emailVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountLinkingResult {
  success: boolean;
  action: 'login' | 'link_required' | 'create_password' | 'verify_email' | 'error' | 'post_register';
  message: string;
  user?: UserAccount;
  requiresVerification?: boolean;
}

// Esquemas de validación
const linkAccountSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  verificationToken: z.string().optional(),
});

const createPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Debe contener al menos una mayúscula, una minúscula y un número'),
  confirmPassword: z.string(),
  verificationToken: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

const postRegisterPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Debe contener al menos una mayúscula, una minúscula y un número'),
  confirmPassword: z.string(),
  accountType: z.enum(['common', 'agency'], {
    required_error: 'Debes seleccionar un tipo de cuenta',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

// Simulación de base de datos (en producción usar Prisma/DB real)
const mockUsers = new Map<string, UserAccount>();
const verificationTokens = new Map<string, { email: string; expires: Date; type: 'email' | 'password' }>();

// Función para buscar usuario por email
export async function findUserByEmail(email: string): Promise<UserAccount | null> {
  // En producción: consultar base de datos
  return mockUsers.get(email.toLowerCase()) || null;
}

// Función para crear usuario
export async function createUser(userData: Partial<UserAccount>): Promise<UserAccount> {
  const user: UserAccount = {
    id: crypto.randomUUID(),
    email: userData.email!.toLowerCase(),
    name: userData.name,
    image: userData.image,
    hasPassword: userData.hasPassword || false,
    providers: userData.providers || [],
    emailVerified: userData.emailVerified,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mockUsers.set(user.email, user);
  return user;
}

// Función para actualizar usuario
export async function updateUser(email: string, updates: Partial<UserAccount>): Promise<UserAccount | null> {
  const user = mockUsers.get(email.toLowerCase());
  if (!user) return null;

  const updatedUser = {
    ...user,
    ...updates,
    updatedAt: new Date(),
  };

  mockUsers.set(email.toLowerCase(), updatedUser);
  return updatedUser;
}

// Generar token de verificación
export async function generateVerificationToken(
  email: string,
  type: 'email' | 'password'
): Promise<string> {
  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

  verificationTokens.set(token, { email: email.toLowerCase(), expires, type });

  // En producción: enviar email con el token
  console.log(`Verification token for ${email}: ${token}`);

  return token;
}

// Verificar token
export async function verifyToken(token: string): Promise<{ email: string; type: 'email' | 'password' } | null> {
  const tokenData = verificationTokens.get(token);

  if (!tokenData || tokenData.expires < new Date()) {
    verificationTokens.delete(token);
    return null;
  }

  return { email: tokenData.email, type: tokenData.type };
}

// Función principal para manejar login con credenciales
export async function handleCredentialsLogin(
  email: string,
  password: string
): Promise<AccountLinkingResult> {
  try {
    const user = await findUserByEmail(email);

    if (!user) {
      return {
        success: false,
        action: 'error',
        message: 'Usuario no encontrado. ¿Deseas registrarte?',
      };
    }

    // Caso 1: Usuario tiene contraseña - login normal
    if (user.hasPassword) {
      // En producción: verificar hash de contraseña con bcrypt
      const passwordValid = await verifyPassword(password, user.email);

      if (passwordValid) {
        return {
          success: true,
          action: 'login',
          message: 'Login exitoso',
          user,
        };
      } else {
        return {
          success: false,
          action: 'error',
          message: 'Contraseña incorrecta',
        };
      }
    }

    // Caso 2: Usuario existe pero sin contraseña (registrado con Google)
    if (user.providers.includes('google') && !user.hasPassword) {
      return {
        success: false,
        action: 'create_password',
        message: 'Esta cuenta fue creada con Google. Para usar email/contraseña, primero debes crear una contraseña.',
        user,
        requiresVerification: !user.emailVerified,
      };
    }

    return {
      success: false,
      action: 'error',
      message: 'Error en la configuración de la cuenta',
    };

  } catch (error) {
    console.error('Error in handleCredentialsLogin:', error);
    return {
      success: false,
      action: 'error',
      message: 'Error interno del servidor',
    };
  }
}

// Función para crear contraseña en cuenta existente
export async function createPasswordForExistingAccount(
  data: z.infer<typeof createPasswordSchema>
): Promise<AccountLinkingResult> {
  try {
    const validation = createPasswordSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        action: 'error',
        message: validation.error.errors[0].message,
      };
    }

    // Verificar token
    const tokenData = await verifyToken(data.verificationToken);
    if (!tokenData || tokenData.email !== data.email.toLowerCase()) {
      return {
        success: false,
        action: 'error',
        message: 'Token de verificación inválido o expirado',
      };
    }

    const user = await findUserByEmail(data.email);
    if (!user) {
      return {
        success: false,
        action: 'error',
        message: 'Usuario no encontrado',
      };
    }

    // Actualizar usuario con contraseña
    const hashedPassword = await hashPassword(data.password);
    const updatedUser = await updateUser(user.email, {
      hasPassword: true,
      providers: [...new Set([...user.providers, 'credentials'])] as ('credentials' | 'google')[],
      emailVerified: new Date(),
    });

    // Guardar contraseña (en producción usar tabla separada)
    await savePasswordHash(user.email, hashedPassword);

    // Limpiar token usado
    verificationTokens.delete(data.verificationToken);

    return {
      success: true,
      action: 'login',
      message: 'Contraseña creada exitosamente. Ya puedes iniciar sesión.',
      user: updatedUser!,
    };

  } catch (error) {
    console.error('Error in createPasswordForExistingAccount:', error);
    return {
      success: false,
      action: 'error',
      message: 'Error interno del servidor',
    };
  }
}

// Función para iniciar proceso de creación de contraseña
export async function initiatePasswordCreation(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return {
        success: false,
        message: 'Usuario no encontrado',
      };
    }

    if (user.hasPassword) {
      return {
        success: false,
        message: 'Esta cuenta ya tiene contraseña configurada',
      };
    }

    const token = await generateVerificationToken(email, 'password');

    return {
      success: true,
      message: 'Se ha enviado un enlace de verificación a tu email',
    };

  } catch (error) {
    console.error('Error in initiatePasswordCreation:', error);
    return {
      success: false,
      message: 'Error interno del servidor',
    };
  }
}

// Funciones auxiliares (en producción implementar con bcrypt y DB)
const passwordHashes = new Map<string, string>();

async function hashPassword(password: string): Promise<string> {
  // En producción: usar bcrypt con salt rounds 10-12
  // return await bcrypt.hash(password, 12);
  return `hashed_${password}_${Date.now()}`; // Mock
}

// Función para registrar nuevo usuario con credenciales
export async function registerUserWithCredentials(
  formData: { email: string; name: string; password: string }
): Promise<AccountLinkingResult> {
  try {
    // Verificar si el usuario ya existe
    const existingUser = await findUserByEmail(formData.email);
    if (existingUser) {
      return {
        success: false,
        action: 'error',
        message: 'Ya existe una cuenta con este email',
      };
    }

    // Crear el usuario
    const newUser = await createUser({
      email: formData.email,
      name: formData.name,
      hasPassword: true,
      providers: ['credentials'],
      emailVerified: new Date(),
    });

    // Guardar la contraseña hasheada
    await savePasswordHash(formData.email, formData.password);

    return {
      success: true,
      action: 'login',
      message: 'Usuario registrado exitosamente',
      user: newUser,
    };
  } catch (error) {
    console.error('Error in registerUserWithCredentials:', error);
    return {
      success: false,
      action: 'error',
      message: 'Error interno del servidor',
    };
  }
}

async function verifyPassword(password: string, email: string): Promise<boolean> {
  // En producción: usar bcrypt.compare
  const hash = passwordHashes.get(email.toLowerCase());
  if (!hash) return false;

  // Mock: extraer la contraseña original del hash mock
  const hashPrefix = 'hashed_';
  if (hash.startsWith(hashPrefix)) {
    const hashContent = hash.substring(hashPrefix.length);
    const lastUnderscoreIndex = hashContent.lastIndexOf('_');
    if (lastUnderscoreIndex > 0) {
      const originalPassword = hashContent.substring(0, lastUnderscoreIndex);
      return originalPassword === password;
    }
  }

  return false;
}

async function savePasswordHash(email: string, hash: string): Promise<void> {
  passwordHashes.set(email.toLowerCase(), hash);
}

// Función para manejar login con Google (callback)
export async function handleGoogleLogin(
  email: string,
  name: string,
  image?: string
): Promise<AccountLinkingResult> {
  try {
    let user = await findUserByEmail(email);

    if (!user) {
      // Crear nuevo usuario con Google - REQUIERE configurar contraseña
      user = await createUser({
        email,
        name,
        image,
        hasPassword: false,
        providers: ['google'],
        emailVerified: new Date(), // Google ya verificó el email
      });

      return {
        success: true,
        action: 'post_register',
        message: 'Registro exitoso. Debes configurar una contraseña para continuar.',
        user: user || undefined,
      };
    } else {
      // Usuario existe - verificar si tiene contraseña configurada
      if (!user.hasPassword) {
        // Usuario existe pero no tiene contraseña - REQUIERE configurarla
        // Agregar Google como provider si no lo tiene
        if (!user.providers.includes('google')) {
          user = await updateUser(email, {
            providers: [...user.providers, 'google'],
            emailVerified: user.emailVerified || new Date(),
            name: user.name || name,
            image: user.image || image,
          });
        }

        return {
          success: true,
          action: 'post_register',
          message: 'Debes configurar una contraseña para acceder a tu cuenta.',
          user: user || undefined,
        };
      } else {
        // Usuario existe y tiene contraseña - LOGIN NORMAL
        // Agregar Google como provider si no lo tiene
        if (!user.providers.includes('google')) {
          user = await updateUser(email, {
            providers: [...user.providers, 'google'],
            emailVerified: user.emailVerified || new Date(),
            name: user.name || name,
            image: user.image || image,
          });
        }

        return {
          success: true,
          action: 'login',
          message: 'Login con Google exitoso',
          user: user || undefined,
        };
      }
    }

  } catch (error) {
    console.error('Error in handleGoogleLogin:', error);
    return {
      success: false,
      action: 'error',
      message: 'Error interno del servidor',
    };
  }
}

// Función para configurar contraseña después del registro con Google (post-register)
export async function setPasswordAfterGoogleRegister(
  data: z.infer<typeof postRegisterPasswordSchema>
): Promise<AccountLinkingResult> {
  try {
    const { email, password, accountType } = data;

    // Hacer petición al endpoint del backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/set-password-after-google-register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        accountType,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      return {
        success: false,
        action: 'error',
        message: result.message,
      };
    }

    return {
      success: true,
      action: 'login',
      message: result.message || 'Contraseña configurada exitosamente. Ya puedes acceder a tu cuenta.',
      user: result.user || undefined,
    };

  } catch (error) {
    console.error('Error in setPasswordAfterGoogleRegister:', error);
    return {
      success: false,
      action: 'error',
      message: 'Error interno del servidor',
    };
  }
}

// Exportar esquemas para uso en componentes
export { linkAccountSchema, createPasswordSchema, postRegisterPasswordSchema };