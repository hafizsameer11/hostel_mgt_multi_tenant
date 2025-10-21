const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    log: ['error'], // Only log errors
});

const dbConnection = async () => {
    try {
        await prisma.$connect();
        console.log('✅ Connected to MySQL via Prisma');
    } catch (err) {
        console.error('❌ Database connection error:', err);
        process.exit(1);
    }
};

// Graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});

module.exports = { prisma, dbConnection };