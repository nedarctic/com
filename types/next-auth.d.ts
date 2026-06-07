import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        accessToken: string;
        refreshToken: string;
        error?: "RefreshTokenError";
        user: {
            id: string;
        } & DefaultSession[user];
    }

    interface User {
        id: string;
        access_token: string;
        refresh_token: string;
        expires_at: number;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        access_token: string;
        refresh_token: string;
        expires_at: number;
        id?: string;
        error?: "RefreshTokenError";
    }
}