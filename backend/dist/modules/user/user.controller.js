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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfiles = exports.updateUserLastLogin = exports.getUsers = exports.updateUser = exports.uploadUserDocumentController = exports.authGoogleUserController = exports.verifyUserController = exports.getUserById = exports.CreateUserController = void 0;
const userService = __importStar(require("./user.service"));
const welcome_email_util_1 = require("../../utils/welcome-email.util");
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
const verifyUserController = async (req, res) => { };
exports.verifyUserController = verifyUserController;
const authGoogleUserController = async (req, res) => {
    const { email, name } = req.body;
    if (!email)
        return res.status(400).json({ message: 'Email requerido' });
    let user = await userService.findUserByEmail(email);
    let isNewUser = false;
    if (!user) {
        user = await userService.createUser({ email, name });
        isNewUser = true;
    }
    if (isNewUser) {
        try {
            await (0, welcome_email_util_1.sendWelcomeEmail)(user.email, name);
        }
        catch (emailError) {
        }
    }
    return res.json({
        _id: user._id,
        isVerified: user.isVerified,
        verification_in_progress: user.verification_in_progress,
        role: user.role,
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
const getUserProfiles = async (req, res) => {
    const userId = req.params.id;
    const includeInactive = req.user?.role === 'admin' || false;
    const profiles = await userService.getUserProfiles(userId, includeInactive);
    res.json(profiles);
};
exports.getUserProfiles = getUserProfiles;
