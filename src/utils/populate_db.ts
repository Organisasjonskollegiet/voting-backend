import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import casual, { email } from 'casual';
import { Meeting } from '../schema/meeting';

(async () => {
    const prisma = new PrismaClient();
    await prisma.$connect();
    // Create 5 random users
    const users = new Array(5).map(
        async (x) => await prisma.user.create({ data: { username: casual.name, email: casual.email } })
    );
})();
