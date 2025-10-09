// next-auth.d.ts
// Coloca este archivo en la raíz de tu proyecto o en /types/next-auth.d.ts

import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            _id: string;
            email: string;
            name: string;
            image?: string;
            isVerified: boolean;
            verification_in_progress: boolean;
            role: 'admin' | 'user' | 'guest';
            hasPassword: boolean;
            emailVerified: Date | null;
            provider: string;
            profileId?: string;
            profileStatus?: string;
            profileVerificationStatus?: string;
            isHighlighted?: boolean;
            highlightedUntil?: string;
        } & DefaultSession["user"];
    }

    interface User extends DefaultUser {
        _id?: string;
        isVerified?: boolean;
        verification_in_progress?: boolean;
        role?: 'admin' | 'user' | 'guest';
        hasPassword?: boolean;
        emailVerified?: Date | null;
        provider?: string;
        profileId?: string;
        profileStatus?: string;
        profileVerificationStatus?: string;
        isHighlighted?: boolean;
        highlightedUntil?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        id: string;
        _id: string;
        email: string;
        name: string;
        image?: string;
        isVerified: boolean;
        verification_in_progress: boolean;
        role: 'admin' | 'user' | 'guest';
        hasPassword: boolean;
        emailVerified: Date | null;
        provider: string;
        profileId?: string;
        profileStatus?: string;
        profileVerificationStatus?: string;
        isHighlighted?: boolean;
        highlightedUntil?: string;
    }
}