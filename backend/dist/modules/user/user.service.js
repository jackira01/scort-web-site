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
exports.deleteUserCompletely = exports.updateUserLastLogin = exports.getUserProfiles = exports.getUsers = exports.updateUser = exports.getUserById = exports.uploadUserDocument = exports.findUserByEmail = exports.createUser = void 0;
const User_model_1 = __importDefault(require("./User.model"));
const profile_verification_model_1 = __importDefault(require("../profile-verification/profile-verification.model"));
const createUser = (data) => User_model_1.default.create(data);
exports.createUser = createUser;
const findUserByEmail = async (email) => {
    const normalizedEmail = email.toLowerCase().trim();
    return User_model_1.default.findOne({ email: normalizedEmail });
};
exports.findUserByEmail = findUserByEmail;
const uploadUserDocument = async (userId, documentUrl) => {
    const options = { new: true };
    const data = { verificationDocument: documentUrl };
    if (!userId || !documentUrl) {
        throw new Error('Faltan datos requeridos');
    }
    const user = await User_model_1.default.findByIdAndUpdate(userId, data, options);
    return user;
};
exports.uploadUserDocument = uploadUserDocument;
const getUserById = async (id) => {
    try {
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            throw new Error('Formato de ID de usuario inválido');
        }
        return await User_model_1.default.findById(id);
    }
    catch (error) {
        throw error;
    }
};
exports.getUserById = getUserById;
const updateUser = (id, data) => User_model_1.default.findByIdAndUpdate(id, data, { new: true });
exports.updateUser = updateUser;
const getUsers = async (filters, options) => {
    return await User_model_1.default.paginate(filters, options);
};
exports.getUsers = getUsers;
const getUserProfiles = async (userId, includeInactive = false) => {
    const user = await User_model_1.default.findById(userId).populate({
        path: 'profiles',
        select: '_id user name age location verification media planAssignment upgrades visible isActive isDeleted',
        populate: {
            path: 'verification',
            model: 'ProfileVerification',
            select: 'verificationProgress verificationStatus'
        }
    });
    let profiles = user?.profiles || [];
    if (!includeInactive) {
        profiles = profiles.filter((profile) => profile.isDeleted !== true);
    }
    const now = new Date();
    return profiles.map((profile) => {
        const activeUpgrades = profile.upgrades?.filter((upgrade) => new Date(upgrade.startAt) <= now && new Date(upgrade.endAt) > now) || [];
        let hasDestacadoUpgrade = activeUpgrades.some((upgrade) => upgrade.code === 'DESTACADO' || upgrade.code === 'HIGHLIGHT');
        let hasImpulsoUpgrade = activeUpgrades.some((upgrade) => upgrade.code === 'IMPULSO' || upgrade.code === 'BOOST');
        if (profile.planAssignment?.planCode === 'DIAMANTE') {
            hasDestacadoUpgrade = true;
        }
        return {
            _id: profile._id,
            user: profile.user,
            name: profile.name,
            age: profile.age,
            location: profile.location,
            verification: profile.verification,
            media: profile.media,
            planAssignment: profile.planAssignment,
            upgrades: profile.upgrades,
            activeUpgrades,
            hasDestacadoUpgrade,
            hasImpulsoUpgrade,
            visible: profile.visible,
            isActive: profile.isActive
        };
    });
};
exports.getUserProfiles = getUserProfiles;
const updateUserLastLogin = async (userId) => {
    try {
        const user = await User_model_1.default.findByIdAndUpdate(userId, {
            'lastLogin.date': new Date(),
            'lastLogin.isVerified': true
        }, { new: true });
        if (user && user.profiles.length > 0) {
            const isLastLoginVerified = true;
            await profile_verification_model_1.default.updateMany({ profile: { $in: user.profiles } }, {
                $set: {
                    'steps.lastLogin.isVerified': isLastLoginVerified,
                    'steps.lastLogin.date': user.lastLogin.date
                }
            });
        }
        return user;
    }
    catch (error) {
        throw new Error(`Error al actualizar lastLogin: ${error}`);
    }
};
exports.updateUserLastLogin = updateUserLastLogin;
const deleteUserCompletely = async (userId) => {
    try {
        if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
            throw new Error('Formato de ID de usuario inválido');
        }
        const user = await User_model_1.default.findById(userId).populate('profiles');
        if (!user) {
            throw new Error('Usuario no encontrado');
        }
        if (user.profiles && user.profiles.length > 0) {
            const profileIds = user.profiles.map((profile) => profile._id);
            await profile_verification_model_1.default.deleteMany({ profile: { $in: profileIds } });
        }
        const { ProfileModel } = await Promise.resolve().then(() => __importStar(require('../profile/profile.model')));
        await ProfileModel.deleteMany({ user: userId });
        try {
            const InvoiceModule = await Promise.resolve().then(() => __importStar(require('../payments/invoice.model')));
            const InvoiceModel = InvoiceModule.default;
            await InvoiceModel.deleteMany({ user: userId });
        }
        catch (error) {
            console.warn('No se pudieron eliminar las facturas:', error);
        }
        await User_model_1.default.findByIdAndDelete(userId);
        return {
            success: true,
            message: 'Usuario y todos sus datos relacionados han sido eliminados exitosamente',
            deletedData: {
                userId,
                profilesCount: user.profiles?.length || 0
            }
        };
    }
    catch (error) {
        throw error;
    }
};
exports.deleteUserCompletely = deleteUserCompletely;
