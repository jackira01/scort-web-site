"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPhoneChangeDetection = exports.checkLastLoginVerification = exports.calculateVerificationProgress = void 0;
const calculateVerificationProgress = (verification, user) => {
    let completedSteps = 0;
    const isAgencyUser = user?.accountType === 'agency';
    const totalSteps = isAgencyUser ? 8 : 9;
    if (verification.steps?.documentPhotos?.documents?.length > 0 &&
        verification.steps?.documentPhotos?.isVerified === true) {
        completedSteps++;
    }
    if (verification.steps?.selfieWithPoster?.photo &&
        verification.steps?.selfieWithPoster?.isVerified === true) {
        completedSteps++;
    }
    if (!isAgencyUser &&
        verification.steps?.selfieWithDoc?.photo &&
        verification.steps?.selfieWithDoc?.isVerified === true) {
        completedSteps++;
    }
    if (verification.steps?.fullBodyPhotos?.photos?.length > 0 &&
        verification.steps?.fullBodyPhotos?.isVerified === true) {
        completedSteps++;
    }
    if (verification.steps?.video?.videoLink &&
        verification.steps?.video?.isVerified === true) {
        completedSteps++;
    }
    if (verification.steps?.videoCallRequested?.isVerified === true) {
        completedSteps++;
    }
    if (verification.steps?.socialMedia?.accounts?.length > 0 &&
        verification.steps?.socialMedia?.isVerified === true) {
        completedSteps++;
    }
    if (verification.steps?.phoneChangeDetected === false) {
        completedSteps++;
    }
    const userLastLoginDate = user?.lastLogin?.date || null;
    const lastLoginVerified = (0, exports.checkLastLoginVerification)(userLastLoginDate);
    if (lastLoginVerified) {
        completedSteps++;
    }
    const progressPercentage = (completedSteps / totalSteps) * 100;
    return Math.round(progressPercentage);
};
exports.calculateVerificationProgress = calculateVerificationProgress;
const checkLastLoginVerification = (lastLoginDate) => {
    if (!lastLoginDate) {
        return true;
    }
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return lastLoginDate >= thirtyDaysAgo;
};
exports.checkLastLoginVerification = checkLastLoginVerification;
const checkPhoneChangeDetection = (phoneChangedAt) => {
    if (!phoneChangedAt) {
        return false;
    }
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return phoneChangedAt >= thirtyDaysAgo;
};
exports.checkPhoneChangeDetection = checkPhoneChangeDetection;
