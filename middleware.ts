import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secretKey = process.env.SESSION_SECRET || "default_super_secret_key_change_me_later";
const encodedKey = new TextEncoder().encode(secretKey);

const protectedRoutes = ["/admin/dashboard"];
const publicRoutes = ["/admin/login"];

export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;
    const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route));
    const isPublicRoute = publicRoutes.some((route) => path.startsWith(route));

    if (!isProtectedRoute && !isPublicRoute) {
        return NextResponse.next();
    }

    const sessionCookie = req.cookies.get("session")?.value;
    let isValid = false;

    if (sessionCookie) {
        try {
            const { payload } = await jwtVerify(sessionCookie, encodedKey, {
                algorithms: ["HS256"],
            });
            if (payload?.isAdmin) {
                isValid = true;
            }
        } catch (err) {
            console.error("JWT Verification failed", err);
        }
    }

    if (isProtectedRoute && !isValid) {
        return NextResponse.redirect(new URL("/admin/login", req.nextUrl));
    }

    if (isPublicRoute && isValid) {
        // If logged in, don't show the login page
        return NextResponse.redirect(new URL("/admin/dashboard", req.nextUrl));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*"],
};
