import NextAuth from "next-auth";

declare module "next-auth" {
    interface User {
        id: string;
        email: string;
        name: string;
        image?: string;
        role: 'admin' | 'user' | 'guest';
        isVerified: boolean;
        verification_in_progress?: boolean;
        hasPassword: boolean;
        provider?: string;
    }

    interface Session {
        user: {
            id: string;
            _id: string;
            email: string;
            name: string;
            image?: string;
            role: 'admin' | 'user' | 'guest';
            verificationDocument?: string[];
            password?: string; // Optional, as not all users may have a password
            isVerified: boolean;
            verification_in_progress?: boolean;
            hasPassword: boolean;
            provider?: string;
        };
        accessToken?: string; // JWT token personalizado
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        email: string;
        name: string;
        image?: string;
        role: string;
        isVerified: boolean;
        verification_in_progress?: boolean;
        hasPassword: boolean;
        provider?: string;
    }
}
