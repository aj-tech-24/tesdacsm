import { PrismaClient } from "@prisma/client";
import { createClient } from "@libsql/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
    prismaTurso?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
    const dbUrl = process.env.TURSO_DATABASE_URL;

    if (!dbUrl) {
        throw new Error("Missing TURSO_DATABASE_URL.");
    }

    const libsql = createClient({
        url: dbUrl,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    const adapter = new PrismaLibSQL(libsql);
    return new PrismaClient({ adapter });
}

function getPrismaClient(): PrismaClient {
    if (!globalForPrisma.prismaTurso) {
        globalForPrisma.prismaTurso = createPrismaClient();
    }
    return globalForPrisma.prismaTurso;
}

export const prisma = new Proxy({} as PrismaClient, {
    get(_target, prop) {
        const client = getPrismaClient() as unknown as Record<string | symbol, unknown>;
        const value = client[prop];
        return typeof value === "function" ? value.bind(client) : value;
    },
}) as PrismaClient;
