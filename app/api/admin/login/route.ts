import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createRateLimitResponse, enforceRateLimit, rejectIfRequestTooLarge } from "@/lib/request-protection";

const secretKey = process.env.SESSION_SECRET || "default_super_secret_key_change_me_later";
const encodedKey = new TextEncoder().encode(secretKey);

export async function POST(req: NextRequest) {
    try {
        const oversizedResponse = rejectIfRequestTooLarge(req, 16 * 1024)
        if (oversizedResponse) {
            return oversizedResponse
        }

        const burstLimit = await enforceRateLimit(req, {
            scope: "admin-login:burst",
            limit: 5,
            windowMs: 60 * 1000,
        })

        if (!burstLimit.allowed) {
            return createRateLimitResponse(burstLimit)
        }

        const sustainedLimit = await enforceRateLimit(req, {
            scope: "admin-login:sustained",
            limit: 20,
            windowMs: 15 * 60 * 1000,
        })

        if (!sustainedLimit.allowed) {
            return createRateLimitResponse(sustainedLimit)
        }

        const { username, password } = await req.json();

        if (!username || !password) {
            return NextResponse.json({ success: false, error: "Username and password required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (user && await bcrypt.compare(password, user.password)) {
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

            const session = await new SignJWT({
                isAdmin: true,
                userId: user.id,
                office: user.office,
                role: user.role,
            })
                .setProtectedHeader({ alg: "HS256" })
                .setIssuedAt()
                .setExpirationTime("7d")
                .sign(encodedKey);

            const cookieStore = await cookies();
            cookieStore.set("session", session, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                expires: expiresAt,
                sameSite: "lax",
                path: "/",
            });

            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json(
                { success: false, error: "Invalid username or password" },
                { status: 401 }
            );
        }
    } catch (error: any) {
        console.error("LOGIN ERROR:", error);
        return NextResponse.json(
            { success: false, error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}
