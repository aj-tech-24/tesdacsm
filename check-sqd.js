const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const allFeedback = await prisma.feedback.findMany({ select: { sqd0: true } });

    const sqdvals = new Set();

    allFeedback.forEach(f => {
        if (f.sqd0) sqdvals.add(f.sqd0);
    });

    console.log("SQD0 values:", Array.from(sqdvals));
}

main().catch(console.error).finally(() => prisma.$disconnect());
