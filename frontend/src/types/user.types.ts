export interface BaseUser {
    _id?: string;
    isVerified?: boolean;
    verification_in_progress?: boolean;
}
export interface User extends BaseUser {
    email?: string;
    name?: string;
    verificationDocument?: string[];
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

