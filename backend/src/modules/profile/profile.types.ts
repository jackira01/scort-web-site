import type { Document, Types } from 'mongoose';

export interface IStories {
    link: string;
    type: 'image' | 'video';
}

export interface IPlanAssignment {
    planId?: Types.ObjectId;    // ref directo a PlanDefinition._id (PREFERRED)
    planCode?: string;          // DEPRECATED: ref lógico a PlanDefinition.code (mantener para compatibilidad)
    variantDays: number;        // 7|15|30|180...
    startAt: Date;
    expiresAt: Date;
}

export interface IProfileUpgrade {
    code: string;               // ref a UpgradeDefinition.code
    startAt: Date;
    endAt: Date;
    purchaseAt: Date;
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
        whatsapp?: string;
        telegram?: string;
        changedAt: Date;
    };
    height: string;
    // Nuevos campos para clasificación de servicios
    basicServices?: string[];
    additionalServices?: string[];
    socialMedia?: {
        instagram?: string;
        facebook?: string;
        tiktok?: string;
        twitter?: string;
        onlyFans?: string;
    };
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
    lastLogin: Date;
    
    // Nuevos campos para motor de visibilidad
    planAssignment: IPlanAssignment | null;
    upgrades: IProfileUpgrade[];
    lastShownAt?: Date;           // para rotación
    visible: boolean;             // default true mientras no expire plan
    isDeleted: boolean;           // borrado lógico - true significa eliminado
    
    // Campos de timestamps de Mongoose
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateProfileDTO {
    user: Types.ObjectId | string;
    name: string;
    description?: string;
    // Nuevos campos para clasificación de servicios
    basicServices?: string[];
    additionalServices?: string[];
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
        whatsapp?: string;
        telegram?: string;
    };
    height: string;
    socialMedia?: {
        instagram?: string;
        facebook?: string;
        tiktok?: string;
        twitter?: string;
        onlyFans?: string;
    };
    media?: {
        gallery?: string[];
        videos?: string[];
        audios?: string[];
        stories?: IStories[];
    };
    availability?: string[];
    rates?: string[];
    paymentHistory?: string[];
    verification?: string;
    
    // Nuevos campos opcionales para motor de visibilidad
    planAssignment?: {
        planId?: Types.ObjectId;
        planCode?: string;  // DEPRECATED: mantener para compatibilidad
        variantDays: number;
        startAt: Date;
        expiresAt: Date;
    };
    upgrades?: {
        code: string;
        startAt: Date;
        endAt: Date;
        purchaseAt: Date;
    }[];
    lastShownAt?: Date;
    visible?: boolean;
    isDeleted?: boolean;
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
        whatsapp?: string;
        telegram?: string;
    };
    height: string;
    socialMedia?: {
        instagram?: string;
        facebook?: string;
        tiktok?: string;
        twitter?: string;
        onlyFans?: string;
    };
    media?: {
        gallery?: string[];
        videos?: string[];
        audios?: string[];
        stories?: IStories[];
    };
    verification?: Types.ObjectId;
    availability?: Types.ObjectId[];
    rates?: Types.ObjectId[];
    paymentHistory?: Types.ObjectId[];
    plan?: Types.ObjectId;
    
    // Nuevos campos opcionales para motor de visibilidad
    planAssignment?: IPlanAssignment;
    upgrades?: IProfileUpgrade[];
    lastShownAt?: Date;
    visible?: boolean;
    isDeleted?: boolean;
}

export interface IProfileVerification extends Document {
    profile: Types.ObjectId;
    verificationStatus: 'pending' | 'verified' | 'rejected';
    verificationProgress: number;
    accountType: 'common' | 'agency';
    requiresIndependentVerification: boolean;
    steps: {
        documentPhotos: {
            frontPhoto: string;
            backPhoto: string;
            selfieWithDocument: string;
            isVerified: boolean;
        }; // required
        videoVerification: {
            videoLink: string;
            isVerified: boolean;
        }; // Video verification.
        videoCallRequested: {
            videoLink: string;
            isVerified: boolean;
        }; // Meet with profile
        socialMedia: {
            isVerified: boolean;
        }; // Social media verification status only
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
