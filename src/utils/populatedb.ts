import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import casual from 'casual';
import bcryptjs from 'bcryptjs';

export const populatedb = async () => {
    const prisma = new PrismaClient();
    await prisma.$connect();

    // Create 5 random users
    const users = await Promise.all(
        [...new Array(5)].map(async () => {
            // Replicates a hashed password
            const password = await bcryptjs.hash(casual.password, 3);
            const user = await prisma.user.create({
                data: { id: casual.uuid, email: casual.email, password: password },
            });
            return user;
        })
    );
    const meeting = await prisma.meeting.create({
        data: {
            ownerId: users[0].id,
            title: casual.word,
            startTime: new Date(),
            description: casual.sentence,
            status: 'ONGOING',
            organization: casual.company_name,
        },
    });

    users.forEach(async (user, i) => {
        await prisma.participant.create({
            data: { userId: user.id, meetingId: meeting.id, role: i == 0 ? 'ADMIN' : 'PARTICIPANT' },
        });
    });
    console.log('Finished populating db 🚀');
};
populatedb();
