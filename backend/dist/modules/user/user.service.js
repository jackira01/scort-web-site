"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserLastLogin = exports.getUserProfiles = exports.getUsers = exports.updateUser = exports.getUserById = exports.uploadUserDocument = exports.findUserByEmail = exports.createUser = void 0;
const User_model_1 = __importDefault(require("./User.model"));
const profile_verification_model_1 = __importDefault(require("../profile-verification/profile-verification.model"));
const verification_progress_utils_1 = require("../profile-verification/verification-progress.utils");
const createUser = (data) => User_model_1.default.create(data);
exports.createUser = createUser;
const findUserByEmail = async (email) => {
    return User_model_1.default.findOne({ email });
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
        console.error('Error en getUserById service:', error);
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
            const isLastLoginVerified = (0, verification_progress_utils_1.checkLastLoginVerification)(user.lastLogin.date);
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
