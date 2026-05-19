import { createClient, Client } from "@libsql/client";

const globalForTurso = globalThis as unknown as {
    tursoClient?: Client;
};

function createTursoClient(): Client {
    const dbUrl = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!dbUrl) {
        throw new Error("Missing TURSO_DATABASE_URL environment variable");
    }

    return createClient({
        url: dbUrl,
        authToken: authToken || undefined,
    });
}

export function getTursoClient(): Client {
    if (!globalForTurso.tursoClient) {
        globalForTurso.tursoClient = createTursoClient();
    }
    return globalForTurso.tursoClient;
}

export type { Client };
