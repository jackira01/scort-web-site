"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateVerificationProgress = void 0;
const calculateVerificationProgress = (verification, user) => {
    let completedSteps = 0;
    const totalSteps = 3;
    if ((verification.steps?.documentPhotos?.frontPhoto ||
        verification.steps?.documentPhotos?.backPhoto ||
        verification.steps?.documentPhotos?.selfieWithDocument) &&
        verification.steps?.documentPhotos?.isVerified === true) {
        completedSteps++;
    }
    if (verification.steps?.videoVerification?.videoLink &&
        verification.steps?.videoVerification?.isVerified === true) {
        completedSteps++;
    }
    if (verification.steps?.socialMedia?.isVerified === true) {
        completedSteps++;
    }
    const progressPercentage = (completedSteps / totalSteps) * 100;
    return Math.round(progressPercentage);
};
exports.calculateVerificationProgress = calculateVerificationProgress;
