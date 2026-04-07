import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const secretKey = process.env.SESSION_SECRET || "default_super_secret_key_change_me_later";
const encodedKey = new TextEncoder().encode(secretKey);

export type SessionPayload = {
    userId: number;
    office: string;
    role: string;
    isAdmin: boolean;
};

export async function getSession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) return null;

    try {
        const { payload } = await jwtVerify(sessionCookie, encodedKey, {
            algorithms: ["HS256"],
        });
        return payload as unknown as SessionPayload;
    } catch (err) {
        return null;
    }
}
