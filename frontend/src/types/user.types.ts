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
}
export interface User extends BaseUser {
    email?: string;
    name: string;
    verificationDocument: string[];
    profiles?: Profile[];
    password?: string;

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
    media: {
        gallery: string[];
        videos: string[];
        stories: string[];
    };
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
