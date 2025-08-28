/* export interface UserProfile {
    id: string;
    name: string;
    avatar: string;
    isVerified: boolean;
    verificationInProgress: boolean;
    plan: 'Gratis' | 'Premium' | 'VIP';
    lastConnection: string;
    verificationImages?: string[];
} */
export interface BaseUser {
    _id?: string;
    isVerified?: boolean;
    verification_in_progress?: boolean;
    role?: 'admin' | 'user' | 'guest';
}
export interface User extends BaseUser {
    email?: string;
    name: string;
    verificationDocument: string[];
    profiles?: Profile[];
    password?: string;
    role: 'admin' | 'user' | 'guest';

}


export type Profile = {
    _id: string;
    user: string;
    name: string;
    description?: string;
    location: {
        country: string;
        state: string;
        city: string;
    };
    features: {
        bodyType: string;
        hairColor: string;
        sex: string;
        gender: string;
        age: number;
        eyes: string;
        height: number;
    };
    services?: string[]; // Servicios separados de features
    media: {
        gallery: string[];
        videos: string[];
        stories: string[];
        audios?: string[];
    };
    // Campos para sistema de planes y upgrades
    planAssignment?: {
        planCode: string;
        variantDays: number;
        startAt: string | Date;
        expiresAt: string | Date;
    };
    upgrades?: {
        code: string;
        startAt: string | Date;
        endAt: string | Date;
        purchaseAt: string | Date;
    }[];
    activeUpgrades?: {
        code: string;
        startAt: string | Date;
        endAt: string | Date;
        purchaseAt: string | Date;
    }[];
    hasDestacadoUpgrade?: boolean;
    hasImpulsoUpgrade?: boolean;
    visible?: boolean;
    isActive?: boolean;
}

export interface UserPaginatedResponse {
    docs: User[];
    totalDocs: number;
    limit: number;
    totalPages: number;
    page: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage: number | null;
    prevPage: number | null;
}
