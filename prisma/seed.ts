const { PrismaClient } = require("@prisma/client");
const { createClient } = require("@libsql/client");
const { PrismaLibSQL } = require("@prisma/adapter-libsql");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env" });

const dbUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
if (!dbUrl) {
    throw new Error("Missing TURSO_DATABASE_URL or DATABASE_URL in environment variables.");
}

if (!process.env.TURSO_AUTH_TOKEN && dbUrl.startsWith("libsql://")) {
    throw new Error("Missing TURSO_AUTH_TOKEN for libsql:// database URL.");
}

const libsql = createClient({
    url: dbUrl,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

const adapter = new PrismaLibSQL(libsql);
const prisma = new PrismaClient({ adapter });

async function main() {
    const defaultPassword = await bcrypt.hash("admin123", 10);

    const users = [
        { username: "po_admin", password: defaultPassword, office: "PO", role: "super_admin" },
        { username: "ccnts_admin", password: defaultPassword, office: "CCNTS", role: "office_admin" },
        { username: "ptc_admin", password: defaultPassword, office: "PTC", role: "office_admin" },
    ];

    for (const user of users) {
        await prisma.user.upsert({
            where: { username: user.username },
            update: {},
            create: user,
        });
    }

    // Seed a default ReportMetadata row if none exists
    const existingMeta = await prisma.reportMetadata.findFirst();
    if (!existingMeta) {
        await prisma.reportMetadata.create({
            data: {
                reportPeriod: "",
                regionExecutive: "Region XI - TESDA Regional Office",
                provinceDistrict: "Province of Davao del Sur",
                operatingUnit: "",
                headOfUnit: "",
                designation: "",
                cusatFocal: "",
            },
        });
    }

    console.log("Seeded 3 users: po_admin, ccnts_admin, ptc_admin (password: admin123)");
    console.log("Seeded default ReportMetadata row.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
