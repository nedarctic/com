import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

function decodeExp(token: string): number {
    const payload = JSON.parse(
        Buffer.from(token.split(".")[1], "base64").toString()
    );
    if (payload.exp) return payload.exp * 1000;
    if (payload.expires_in) return Date.now() + payload.expires_in * 1000;
    throw new Error("No expiration field found in JWT");
}

async function refreshAccessToken(refreshToken: string, oldToken: any) {
    const res = await fetch(`${process.env.NEST_API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error("Refresh failed");

    const accessToken = data.access_token;
    if (!accessToken) throw new Error("Missing access_token");

    const expiresMs = decodeExp(accessToken);

    return {
        ...oldToken,
        access_token: accessToken,
        refresh_token: data.refresh_token ?? oldToken.refresh_token,
        expires_at: expiresMs,
        error: undefined,
    };
}

export async function proxy(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const url = req.nextUrl;

    // If no token, redirect to login (using NextAuth's built-in signin page)
    if (!token) {
        const signInUrl = new URL("/login", req.url);
        signInUrl.searchParams.set("callbackUrl", url.pathname);
        return NextResponse.redirect(signInUrl);
    }

    const now = Date.now();
    const isValid = token.expires_at > now;

    if (isValid) {
        return NextResponse.next();
    }

    // Token expired – refresh it
    try {
        const newToken = await refreshAccessToken(token.refresh_token, token);
        const response = NextResponse.next();

        // Encode the new token back into the session cookie
        const { encode } = await import("next-auth/jwt");
        const newCookieValue = await encode({
            token: newToken,
            secret: process.env.NEXTAUTH_SECRET!,
            maxAge: 30 * 24 * 60 * 60, // same as your session maxAge
        });

        response.cookies.set("next-auth.session-token", newCookieValue, {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            secure: process.env.NODE_ENV === "production",
        });

        return response;
    } catch (error) {
        // Refresh failed – clear cookie and redirect to login
        const response = NextResponse.redirect(new URL("/login", req.url));
        response.cookies.delete("next-auth.session-token");
        return response;
    }
}


export const config = {
    matcher: ["/((?!api|_next/static|login|_next/image|favicon.ico).*)"]
};