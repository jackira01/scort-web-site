"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProfileVerification = exports.getAllProfileVerifications = exports.updateVerificationStatus = exports.updateVerificationSteps = exports.updateProfileVerification = exports.createProfileVerification = exports.getProfileVerificationById = exports.getProfileVerificationByProfileId = void 0;
const profile_verification_model_1 = __importDefault(require("./profile-verification.model"));
const profile_model_1 = require("../profile/profile.model");
const shouldRequireIndependentVerification = async (userId, currentProfileId) => {
    try {
        const existingProfilesCount = await profile_model_1.ProfileModel.countDocuments({ user: userId });
        if (existingProfilesCount <= 1) {
            return false;
        }
        return true;
    }
    catch (error) {
        return true;
    }
};
const getDefaultVerificationSteps = (accountType, requiresIndependentVerification, lastLoginVerified, userLastLoginDate) => {
    const baseSteps = {
        documentPhotos: {
            documents: [],
            isVerified: false
        },
        selfieWithPoster: {
            photo: undefined,
            isVerified: false
        },
        selfieWithDoc: {
            photo: undefined,
            isVerified: false
        },
        fullBodyPhotos: {
            photos: [],
            isVerified: false
        },
        video: {
            videoLink: undefined,
            isVerified: false
        },
        videoCallRequested: {
            videoLink: undefined,
            isVerified: false
        },
        socialMedia: {
            accounts: [],
            isVerified: false
        },
        phoneChangeDetected: false,
        lastLogin: {
            isVerified: lastLoginVerified,
            date: userLastLoginDate
        }
    };
    if (accountType === 'common' && !requiresIndependentVerification) {
        return {
            ...baseSteps,
            documentPhotos: {
                documents: [],
                isVerified: true
            },
            selfieWithDoc: {
                photo: undefined,
                isVerified: true
            }
        };
    }
    return baseSteps;
};
const verification_progress_utils_1 = require("./verification-progress.utils");
const recalculateVerificationProgress = async (verification) => {
    try {
        const populatedVerification = await profile_verification_model_1.default.findById(verification._id)
            .populate({
            path: 'profile',
            populate: {
                path: 'user',
                model: 'User'
            }
        })
            .lean();
        if (!populatedVerification?.profile) {
            return verification.verificationProgress;
        }
        const user = populatedVerification.profile.user;
        const newProgress = (0, verification_progress_utils_1.calculateVerificationProgress)(verification, user);
        const updatedVerification = await profile_verification_model_1.default.findByIdAndUpdate(verification._id, { $set: { verificationProgress: newProgress } }, { new: true }).lean();
        return newProgress;
    }
    catch (error) {
        return verification.verificationProgress;
    }
};
const getProfileVerificationByProfileId = async (profileId) => {
    try {
        const verification = await profile_verification_model_1.default.findOne({ profile: profileId })
            .populate('profile', 'name user')
            .lean();
        return verification;
    }
    catch (error) {
        throw new Error(`Error al obtener verificación del perfil: ${error}`);
    }
};
exports.getProfileVerificationByProfileId = getProfileVerificationByProfileId;
const getProfileVerificationById = async (verificationId) => {
    try {
        const verification = await profile_verification_model_1.default.findById(verificationId)
            .populate('profile', 'name user')
            .lean();
        return verification;
    }
    catch (error) {
        throw new Error(`Error al obtener verificación: ${error}`);
    }
};
exports.getProfileVerificationById = getProfileVerificationById;
const createProfileVerification = async (verificationData) => {
    try {
        let userLastLoginDate = null;
        let lastLoginVerified = true;
        let accountType = 'common';
        let requiresIndependentVerification = false;
        if (verificationData.profile) {
            const profile = await profile_model_1.ProfileModel.findById(verificationData.profile).populate('user');
            if (profile && profile.user) {
                accountType = profile.user.accountType || 'common';
                if (profile.user.lastLogin?.date) {
                    userLastLoginDate = profile.user.lastLogin.date;
                    lastLoginVerified = (0, verification_progress_utils_1.checkLastLoginVerification)(userLastLoginDate);
                }
                if (accountType === 'agency') {
                    const userId = profile.user._id || profile.user.id;
                    requiresIndependentVerification = await shouldRequireIndependentVerification(userId, verificationData.profile);
                }
            }
        }
        const defaultSteps = getDefaultVerificationSteps(accountType, requiresIndependentVerification, lastLoginVerified, userLastLoginDate);
        const verificationWithDefaults = {
            ...verificationData,
            steps: defaultSteps,
            verificationProgress: 0,
            accountType,
            requiresIndependentVerification
        };
        const verification = new profile_verification_model_1.default(verificationWithDefaults);
        await verification.save();
        const populatedVerification = await profile_verification_model_1.default.findById(verification._id)
            .populate('profile', 'name user')
            .lean();
        return populatedVerification;
    }
    catch (error) {
        throw new Error(`Error al crear verificación: ${error}`);
    }
};
exports.createProfileVerification = createProfileVerification;
const updateProfileVerification = async (verificationId, updateData) => {
    try {
        const isUpdatingSteps = 'steps' in updateData && updateData.steps !== undefined;
        const verification = await profile_verification_model_1.default.findByIdAndUpdate(verificationId, updateData, { new: true, runValidators: true })
            .populate('profile', 'name user')
            .lean();
        if (!verification) {
            throw new Error('Verificación no encontrada');
        }
        if (isUpdatingSteps) {
            await recalculateVerificationProgress(verification);
            const updatedVerification = await profile_verification_model_1.default.findById(verificationId)
                .populate('profile', 'name user')
                .lean();
            return updatedVerification;
        }
        return verification;
    }
    catch (error) {
        throw new Error(`Error al actualizar verificación: ${error}`);
    }
};
exports.updateProfileVerification = updateProfileVerification;
const updateVerificationSteps = async (verificationId, stepsUpdate) => {
    try {
        const currentVerification = await profile_verification_model_1.default.findById(verificationId).lean();
        if (!currentVerification) {
            throw new Error('Verificación no encontrada');
        }
        const updatedSteps = { ...currentVerification.steps };
        Object.keys(stepsUpdate).forEach(stepKey => {
            const stepData = stepsUpdate[stepKey];
            const currentStepData = updatedSteps[stepKey];
            if (stepData && typeof stepData === 'object') {
                const mergedData = Object.assign({}, currentStepData, stepData);
                updatedSteps[stepKey] = mergedData;
            }
            else {
                updatedSteps[stepKey] = stepData;
            }
        });
        const verification = await profile_verification_model_1.default.findByIdAndUpdate(verificationId, { $set: { steps: updatedSteps } }, { new: true, runValidators: true }).lean();
        if (!verification) {
            throw new Error('Verificación no encontrada después de actualización');
        }
        await recalculateVerificationProgress(verification);
        const finalVerification = await profile_verification_model_1.default.findById(verificationId)
            .populate('profile', 'name user')
            .lean();
        return finalVerification;
    }
    catch (error) {
        throw new Error(`Error al actualizar pasos de verificación: ${error}`);
    }
};
exports.updateVerificationSteps = updateVerificationSteps;
const updateVerificationStatus = async (verificationId, status, reason) => {
    try {
        const updateData = {
            verificationStatus: status,
        };
        if (status === 'verified') {
            updateData.verifiedAt = new Date();
        }
        else if (status === 'rejected' && reason) {
            updateData.verificationFailedAt = new Date();
            updateData.verificationFailedReason = reason;
        }
        const verification = await profile_verification_model_1.default.findByIdAndUpdate(verificationId, updateData, { new: true, runValidators: true })
            .populate('profile', 'name user')
            .lean();
        return verification;
    }
    catch (error) {
        throw new Error(`Error al actualizar estado de verificación: ${error}`);
    }
};
exports.updateVerificationStatus = updateVerificationStatus;
const getAllProfileVerifications = async (filters) => {
    try {
        const { status, page = 1, limit = 10 } = filters;
        const query = {};
        if (status) {
            query.verificationStatus = status;
        }
        const skip = (page - 1) * limit;
        const [verifications, total] = await Promise.all([
            profile_verification_model_1.default.find(query)
                .populate('profile', 'name user')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            profile_verification_model_1.default.countDocuments(query)
        ]);
        return {
            verifications,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }
    catch (error) {
        throw new Error(`Error al obtener verificaciones: ${error}`);
    }
};
exports.getAllProfileVerifications = getAllProfileVerifications;
const deleteProfileVerification = async (verificationId) => {
    try {
        const verification = await profile_verification_model_1.default.findByIdAndDelete(verificationId);
        return verification;
    }
    catch (error) {
        throw new Error(`Error al eliminar verificación: ${error}`);
    }
};
exports.deleteProfileVerification = deleteProfileVerification;
