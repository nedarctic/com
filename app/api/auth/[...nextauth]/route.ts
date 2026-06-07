import NextAuth, { type AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

function decodeExp(token: string): number {
    const payload = JSON.parse(
        Buffer.from(token.split(".")[1], "base64").toString()
    );
    if (payload.exp) return payload.exp * 1000;
    if (payload.expires_in) return Date.now() + payload.expires_in * 1000;
    throw new Error("No expiration field found in JWT");
}

export const authOptions: AuthOptions = {
    session: { strategy: "jwt" },

    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: {},
                password: {},
            },

            async authorize(credentials) {
                const res = await fetch(
                    `${process.env.NEST_API_URL}/auth/login`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            email: credentials?.email,
                            password: credentials?.password,
                        }),
                    }
                );

                const data = await res.json();
                if (!res.ok) return null;

                const accessToken = data.access_token;

                const expiresAt = decodeExp(accessToken);
                if (isNaN(expiresAt)) throw new Error("Invalid token expiration");

                return {
                    id: data.user.id,
                    access_token: accessToken,
                    refresh_token: data.refresh_token,
                    expires_at: decodeExp(accessToken),
                };
            },
        }),
    ],

    callbacks: {
        async jwt({ token, user }: any) {
            if (user) {
                return {
                    id: user.id,
                    access_token: user.access_token,
                    refresh_token: user.refresh_token,
                    expires_at: user.expires_at,
                };
            }
            // Optional: still check expiration here as a fallback,
            // but middleware will have already refreshed if needed.
            if (token.expires_at > Date.now()) return token;
            // If we reach here, middleware didn't refresh – maybe refresh again or return null
            return null;
        },
        async session({ session, token }) {
            session.accessToken = token.access_token;
            session.refreshToken = token.refresh_token;
            session.user.id = token.id;
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }