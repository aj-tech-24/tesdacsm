const { PrismaClient } = require("@prisma/client");
const { createClient } = require("@libsql/client");
const { PrismaLibSql } = require("@prisma/adapter-libsql");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env" });

const libsql = createClient({
    url: "libsql://tesda-csm-aj-tech-24.aws-ap-northeast-1.turso.io",
    authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQ4NTc4MTAsImlkIjoiMDE5ZDNkYzQtNGIwMS03NzBiLWFiMmItZDg4YzMwOWU4YTVlIiwicmlkIjoiZWFlOTVmNGEtYjA1Yy00MGFjLThiMzQtMTE5OGIzNWVmMWY3In0.-fuCsSqvgH8zwvUSPlaj6V0-sT_i_s8hGD7sYQxN3O9kAqd15jJw2MEdXTHSdMbQz17Qh44huA1IJhiCX53IBg",
});

const adapter = new PrismaLibSql(libsql);
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
