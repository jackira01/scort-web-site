import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      _id: string;
      role?: string;
      profilePicture?: string;
      hasPassword?: boolean;
      isVerified?: boolean;
      verification_in_progress?: boolean;
      provider?: string;
      profileId?: string;
      profileStatus?: string;
      profileVerificationStatus?: string;
      isHighlighted?: boolean;
      highlightedUntil?: string;
      verificationDocument?: string[];
      password?: string;
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    _id: string;
    role?: string;
    profilePicture?: string;
    hasPassword?: boolean;
    isVerified?: boolean;
    verification_in_progress?: boolean;
    provider?: string;
    profileId?: string;
    profileStatus?: string;
    profileVerificationStatus?: string;
    isHighlighted?: boolean;
    highlightedUntil?: string;
    verificationDocument?: string[];
    password?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    _id: string;
    role?: string;
    profilePicture?: string;
    hasPassword?: boolean;
    isVerified?: boolean;
    verification_in_progress?: boolean;
    provider?: string;
    profileId?: string;
    profileStatus?: string;
    profileVerificationStatus?: string;
    isHighlighted?: boolean;
    highlightedUntil?: string;
    verificationDocument?: string[];
    password?: string;
  }
}