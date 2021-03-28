import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import casual from 'casual';

export const populatedb = async () => {
    const prisma = new PrismaClient();
    await prisma.$connect();

    // Create 5 random users
    const users = await Promise.all(
        [...new Array(5)].map(
            async (x) => await prisma.user.create({ data: { username: casual.name, email: casual.email } })
        )
    );
    const meeting = await prisma.meeting.create({
        data: {
            ownerId: users[0].id,
            title: casual.word,
            startTime: new Date(),
            description: casual.sentence,
            status: 'ONGOING',
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
