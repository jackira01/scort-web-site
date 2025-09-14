"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateVerificationProgress = void 0;
const calculateVerificationProgress = (verification, user) => {
    let completedSteps = 0;
    const totalSteps = 3;
    if (verification.steps?.documentPhotos?.documents?.length > 0 &&
        verification.steps?.documentPhotos?.isVerified === true) {
        completedSteps++;
    }
    if (verification.steps?.video?.videoLink &&
        verification.steps?.video?.isVerified === true) {
        completedSteps++;
    }
    if (verification.steps?.socialMedia?.accounts?.length > 0 &&
        verification.steps?.socialMedia?.isVerified === true) {
        completedSteps++;
    }
    const progressPercentage = (completedSteps / totalSteps) * 100;
    return Math.round(progressPercentage);
};
exports.calculateVerificationProgress = calculateVerificationProgress;
