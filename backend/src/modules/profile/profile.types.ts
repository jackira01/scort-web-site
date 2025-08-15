import type { Document, Types } from 'mongoose';

export interface IStories {
    link: string;
    type: 'image' | 'video';
}

export interface IProfile extends Document {
    user: Types.ObjectId;
    name: string;
    description: string;
    isActive: boolean;
    location: {
        country: {
            value: string; // Valor normalizado (sin tildes, minúsculas)
            label: string; // Valor para mostrar (con tildes, formato original)
        };
        department: {
            value: string; // Valor normalizado (sin tildes, minúsculas)
            label: string; // Valor para mostrar (con tildes, formato original)
        };
        city: {
            value: string; // Valor normalizado (sin tildes, minúsculas)
            label: string; // Valor para mostrar (con tildes, formato original)
        };
    };
    features: {
        group_id: Types.ObjectId;
        value: string | string[];
    }[];
    services?: string[]; // Servicios separados de features
    age: string;
    contact: {
        number: string;
        whatsapp: boolean;
        telegram: boolean;
        changedAt: Date;
    };
    height: string;
    media: {
        gallery: string[];
        videos: string[];
        stories: IStories[];
        audios: string[];
    };
    availability: {
        dayOfWeek: string;
        slots: {
            start: string;
            end: string;
            timezone: string;
        }[];
    }[];
    verification: Types.ObjectId | boolean;
    rates: {
        hour: string; // formato HH:mm
        price: number;
    }[];
    paymentHistory: Types.ObjectId[];
    plan: Types.ObjectId;
    upgrades: Types.ObjectId[];
    lastLogin: Date;
}

export interface CreateProfileDTO {
    user: Types.ObjectId | string;
    name: string;
    description?: string;
    location: {
        country: {
            value: string;
            label: string;
        };
        department: {
            value: string;
            label: string;
        };
        city: {
            value: string;
            label: string;
        };
    };
    features: {
        group_id: string;
        value: string[];
    }[];
    age: string;
    contact: {
        number: string;
        whatsapp: boolean;
        telegram: boolean;
    };
    height: string;
    media?: {
        gallery?: string[];
        videos?: string[];
        audios?: string[];
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
        country: {
            value: string;
            label: string;
        };
        department: {
            value: string;
            label: string;
        };
        city: {
            value: string;
            label: string;
        };
    };
    features: {
        group_id: Types.ObjectId | string;
        value: string;
    }[];
    age: string;
    contact: {
        number: string;
        whatsapp: boolean;
        telegram: boolean;
    };
    height: string;
    media?: {
        gallery?: string[];
        videos?: string[];
        audios?: string[];
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
    verificationStatus: 'pending' | 'verified' | 'rejected';
    verificationProgress: number;
    steps: {
        documentPhotos: {
            documents: string[]
            isVerified: boolean;
        }; // required
        selfieWithPoster: {
            photo: string;
            isVerified: boolean;
        }; // required
        selfieWithDoc: {
            photo: string;
            isVerified: boolean;
        }; // required
        fullBodyPhotos: {
            photos: string[];
            isVerified: boolean;
        }; // required. at least 2 full body images.at least 2 face images. Face images verification. Full body images verification.
        video: {
            videoLink: string;
            isVerified: boolean;
        }; // required. Video verification.
        videoCallRequested: {
            videoLink: string;
            isVerified: boolean;
        }; // Meet with profile
        socialMedia: {
            accounts: string[];
            isVerified: boolean;
        }; // required. At least 1 social media account.
        phoneChangeDetected: boolean;
        lastLogin: {
            isVerified: boolean;
            date: Date | null;
        };
    }

    verifiedAt: Date; // Date when profile was verified.
    verificationFailedAt: Date; // Date when profile verification failed.
    verificationFailedReason: string; // Reason for verification failure.
}
