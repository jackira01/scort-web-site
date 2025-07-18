import NextAuth from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            _id: string;
            email: string;
            name: string;
            verificationDocument?: string[];
            password?: string; // Optional, as not all users may have a password
            isVerified: boolean;
            verification_in_progress?: boolean;
        };
    }
}
