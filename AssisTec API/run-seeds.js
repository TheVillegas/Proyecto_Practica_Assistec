const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    const sql = fs.readFileSync('../BD/postgres/seeds.sql', 'utf8');
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    for (const stmt of statements) {
        await prisma.$executeRawUnsafe(stmt);
    }
    console.log('Seeds ejecutados correctamente');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
