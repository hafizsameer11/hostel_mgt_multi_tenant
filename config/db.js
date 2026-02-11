const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    log: ['error'], // Only log errors
});

// Connection retry logic
const MAX_RETRIES = 5;
const RETRY_DELAY = 2000; // 2 seconds

const dbConnection = async (retries = 0) => {
    try {
        await prisma.$connect();
        console.log('✅ Connected to MySQL via Prisma');
        
        // Test the connection with a simple query
        await prisma.$queryRaw`SELECT 1`;
        console.log('✅ Database connection verified');
    } catch (err) {
        console.error(`❌ Database connection error (attempt ${retries + 1}/${MAX_RETRIES}):`, err.message);
        
        if (retries < MAX_RETRIES - 1) {
            console.log(`🔄 Retrying connection in ${RETRY_DELAY / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return dbConnection(retries + 1);
        } else {
            console.error('❌ Failed to connect to database after', MAX_RETRIES, 'attempts');
            console.error('💡 Please check:');
            console.error('   1. MySQL server is running');
            console.error('   2. DATABASE_URL in .env is correct');
            console.error('   3. Database "hotel_management" exists');
            console.error('   4. MySQL user has proper permissions');
            console.error('\nCurrent DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'NOT SET');
            // Don't exit immediately - let the server start and handle errors gracefully
            // process.exit(1);
        }
    }
};

// Graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});

process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
});

module.exports = { prisma, dbConnection };