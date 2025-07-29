import type { Document, Types } from 'mongoose';

export interface IProfile extends Document {
    user: Types.ObjectId;
    name: string;
    description: string;
    location: {
        country: string;
        state: string;
        city: string;
    };
    features: {
        group: string;
        value: string | string[];
    }[];
    age: string;
    phoneNumber: {
        phone: string;
        whatsapp: boolean;
        telegram: boolean;
    };
    height: string;
    media: {
        gallery: string[];
        videos: string[];
        stories: string[];
    };
    availability: Types.ObjectId[];
    verification: Types.ObjectId | boolean;
    rates: {
        hour: string; // formato HH:mm
        price: number;
    }[];
    paymentHistory: Types.ObjectId[];
    plan: Types.ObjectId;
    upgrades: Types.ObjectId[];
}

export interface CreateProfileDTO {
    user: Types.ObjectId;
    name: string;
    description?: string;
    location: {
        country: string;
        state: string;
        city: string;
    };
    features: {
        group: string;
        value: string[];
    }[];
    media?: {
        gallery?: string[];
        videos?: string[];
        stories?: string[];
    };
    availability?: string[];
    rates?: string[];
    paymentHistory?: string[];
    plan?: string;
    upgrades?: string[];
    verification?: string;
}


export interface IProfileInput {
    user: Types.ObjectId | string;
    name: string;
    description?: string;
    location: {
        country: string;
        state: string;
        city: string;
    };
    features: {
        group: Types.ObjectId | string;
        value: string;
    }[];
    media?: {
        gallery?: string[];
        videos?: string[];
        stories?: string[];
    };
    verification?: Types.ObjectId;
    availability?: Types.ObjectId[];
    rates?: Types.ObjectId[];
    paymentHistory?: Types.ObjectId[];
    plan?: Types.ObjectId;
    upgrades?: Types.ObjectId[];
}

export interface IProfileVerification extends Document {
    profile: Types.ObjectId;
    documentPhotos: string[]; // required
    selfieWithDoc: string; // required
    facePhotos: string[]; // required
    fullBodyPhotos: string[];
    verificationVideo: string;
    videoCallRequested: boolean;
    lastSeen: Date;
    phoneChangeDetected: boolean;
    isVerified: boolean;
    verifiedAt: Date;
}
