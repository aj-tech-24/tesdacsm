import { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

const libsql = createClient({
    url: process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || "",
    authToken: process.env.TURSO_AUTH_TOKEN,
})

const adapter = new PrismaLibSQL(libsql)

const globalForPrisma = globalThis as unknown as { prismaTurso: PrismaClient }

export const prisma = globalForPrisma.prismaTurso || new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prismaTurso = prisma
