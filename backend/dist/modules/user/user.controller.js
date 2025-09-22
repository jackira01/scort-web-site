"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfiles = exports.setPasswordAfterGoogleRegisterController = exports.updateUserLastLogin = exports.getUsers = exports.updateUser = exports.uploadUserDocumentController = exports.authGoogleUserController = exports.verifyUserController = exports.requestPasswordResetController = exports.loginUserController = exports.registerUserController = exports.getUserById = exports.resetPasswordController = exports.verifyPasswordResetCodeController = exports.CreateUserController = void 0;
const User_model_1 = __importDefault(require("./User.model"));
const userService = __importStar(require("./user.service"));
const welcome_email_util_1 = require("../../utils/welcome-email.util");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const CreateUserController = async (req, res) => {
    try {
        const user = await userService.createUser(req.body);
        if (user.email) {
            try {
                await (0, welcome_email_util_1.sendWelcomeEmail)(user.email, user.name);
            }
            catch (emailError) {
            }
        }
        res.status(201).json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.CreateUserController = CreateUserController;
const verifyPasswordResetCodeController = async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            return res.status(400).json({
                success: false,
                message: 'Email y código son requeridos'
            });
        }
        const user = await userService.findUserByEmail(email);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Código inválido o expirado'
            });
        }
        if (!user.resetPasswordCode || !user.resetPasswordExpires) {
            return res.status(400).json({
                success: false,
                message: 'Código inválido o expirado'
            });
        }
        if (new Date() > user.resetPasswordExpires) {
            await User_model_1.default.findByIdAndUpdate(user._id, {
                $unset: { resetPasswordCode: 1, resetPasswordExpires: 1 }
            });
            return res.status(400).json({
                success: false,
                message: 'Código inválido o expirado'
            });
        }
        if (user.resetPasswordCode !== code) {
            return res.status(400).json({
                success: false,
                message: 'Código inválido o expirado'
            });
        }
        const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const tokenExpiration = new Date(Date.now() + 10 * 60 * 1000);
        await User_model_1.default.findByIdAndUpdate(user._id, {
            resetPasswordToken: resetToken,
            resetPasswordTokenExpires: tokenExpiration,
            $unset: { resetPasswordCode: 1, resetPasswordExpires: 1 }
        });
        res.json({
            success: true,
            message: 'Código verificado correctamente',
            resetToken: resetToken
        });
    }
    catch (error) {
        console.error('Error en verificación de código:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};
exports.verifyPasswordResetCodeController = verifyPasswordResetCodeController;
const resetPasswordController = async (req, res) => {
    try {
        const { email, token, newPassword } = req.body;
        if (!email || !token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Email, token y nueva contraseña son requeridos'
            });
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número'
            });
        }
        const user = await userService.findUserByEmail(email);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Token de restablecimiento inválido'
            });
        }
        if (!user.resetPasswordToken ||
            !user.resetPasswordTokenExpires ||
            user.resetPasswordToken !== token ||
            user.resetPasswordTokenExpires < new Date()) {
            if (user.resetPasswordTokenExpires && user.resetPasswordTokenExpires < new Date()) {
                await User_model_1.default.findByIdAndUpdate(user._id, {
                    $unset: { resetPasswordToken: 1, resetPasswordTokenExpires: 1 }
                });
            }
            return res.status(400).json({
                success: false,
                message: 'Token de restablecimiento inválido o expirado'
            });
        }
        const saltRounds = 12;
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, saltRounds);
        await User_model_1.default.findByIdAndUpdate(user._id, {
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
    }
    catch (error) {
        console.error('Error en resetPasswordController:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};
exports.resetPasswordController = resetPasswordController;
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
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
            hasPassword: user.hasPassword,
        });
    }
    catch (error) {
        res.status(500).json({
            mensaje: 'Error interno del servidor al obtener usuario',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
exports.getUserById = getUserById;
const registerUserController = async (req, res) => {
    try {
        const { email, name, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }
        const existingUser = await userService.findUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe una cuenta con este email'
            });
        }
        const saltRounds = 12;
        const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
        const user = await userService.createUser({
            email,
            name: name || email.split('@')[0],
            password: hashedPassword,
            providers: ['credentials'],
            hasPassword: true,
            emailVerified: new Date(),
        });
        try {
            await (0, welcome_email_util_1.sendWelcomeEmail)(user.email, user.name);
        }
        catch (emailError) {
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
    }
    catch (error) {
        console.error('Error in registerUserController:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};
exports.registerUserController = registerUserController;
const loginUserController = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }
        const user = await userService.findUserByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }
        if (!user.hasPassword || !user.password) {
            return res.status(401).json({
                success: false,
                message: 'Esta cuenta no tiene contraseña configurada. Usa otro método de login.'
            });
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }
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
    }
    catch (error) {
        console.error('Error in loginUserController:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};
exports.loginUserController = loginUserController;
const requestPasswordResetController = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'El correo electrónico es requerido'
            });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'El formato del correo electrónico no es válido'
            });
        }
        const user = await userService.findUserByEmail(email);
        if (user) {
            const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
            const expirationTime = new Date(Date.now() + 15 * 60 * 1000);
            await User_model_1.default.findByIdAndUpdate(user._id, {
                resetPasswordCode: resetCode,
                resetPasswordExpires: expirationTime
            });
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
                    console.log(`Código de recuperación para ${email}: ${resetCode}`);
                }
            }
            catch (emailError) {
                console.error('Error enviando código de recuperación:', emailError);
                console.log(`Código de recuperación para ${email}: ${resetCode}`);
            }
        }
        res.json({
            success: true,
            message: 'Si el correo existe en nuestra base de datos, se te enviará un código de verificación'
        });
    }
    catch (error) {
        console.error('Error en solicitud de recuperación de contraseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};
exports.requestPasswordResetController = requestPasswordResetController;
const verifyUserController = async (req, res) => { };
exports.verifyUserController = verifyUserController;
const authGoogleUserController = async (req, res) => {
    const { email, name } = req.body;
    if (!email)
        return res.status(400).json({ message: 'Email requerido' });
    let user = await userService.findUserByEmail(email);
    let isNewUser = false;
    if (!user) {
        user = await userService.createUser({
            email,
            name,
            providers: ['google'],
            hasPassword: false,
            emailVerified: new Date()
        });
        isNewUser = true;
    }
    else {
        if (!user.providers.includes('google')) {
            user = await userService.updateUser(user._id?.toString() || '', {
                providers: [...user.providers, 'google'],
                emailVerified: user.emailVerified || new Date(),
                name: user.name || name,
            });
        }
    }
    if (!user) {
        return res.status(500).json({
            success: false,
            message: 'Error al procesar usuario'
        });
    }
    if (isNewUser) {
        try {
            await (0, welcome_email_util_1.sendWelcomeEmail)(user.email, name);
        }
        catch (emailError) {
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
            hasPassword: user.hasPassword
        }
    });
};
exports.authGoogleUserController = authGoogleUserController;
const uploadUserDocumentController = async (req, res) => {
    const { userId, documentsUrl } = req.body;
    if (!userId || documentsUrl) {
        return res.status(400).json({ message: 'Faltan datos requeridos' });
    }
    try {
        const documentUrl = await userService.uploadUserDocument(userId, documentsUrl);
        return res.json({ documentUrl });
    }
    catch (error) {
        return res
            .status(500)
            .json({ message: 'Error al subir el documento', error });
    }
};
exports.uploadUserDocumentController = uploadUserDocumentController;
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'ID de usuario requerido'
            });
        }
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al actualizar usuario',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
exports.updateUser = updateUser;
const getUsers = async (req, res) => {
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
        return res.status(200).json(getUsers);
    }
    catch (error) {
        res.status(500).json({ message: error });
    }
};
exports.getUsers = getUsers;
const updateUserLastLogin = async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: `Error al actualizar lastLogin: ${error}`
        });
    }
};
exports.updateUserLastLogin = updateUserLastLogin;
const setPasswordAfterGoogleRegisterController = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }
        const user = await userService.findUserByEmail(email);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        if (user.hasPassword) {
            return res.status(400).json({
                success: false,
                message: 'Este usuario ya tiene una contraseña configurada'
            });
        }
        const saltRounds = 12;
        const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
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
    }
    catch (error) {
        console.error('Error in setPasswordAfterGoogleRegisterController:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};
exports.setPasswordAfterGoogleRegisterController = setPasswordAfterGoogleRegisterController;
const getUserProfiles = async (req, res) => {
    const userId = req.params.id;
    const includeInactive = req.user?.role === 'admin' || false;
    const profiles = await userService.getUserProfiles(userId, includeInactive);
    res.json(profiles);
};
exports.getUserProfiles = getUserProfiles;
