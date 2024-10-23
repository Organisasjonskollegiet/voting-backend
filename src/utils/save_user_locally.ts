import { PrismaClient, User } from '@prisma/client';
import axios from 'axios';

interface Auth0Profile {
    sub: string;
    nickname: string;
    name: string;
    picture: string;
    updated_at: Date;
    email: string;
}

// Saves the auth0 user profile to the database if it does not exist locally
// This is mainly to make local development easier
export const saveAuth0UserIfNotExist = async (prisma: PrismaClient, email: string, id: string) => {
    const userCount = await prisma.user.findUnique({ where: { email: email } });
    if (!userCount) {
        const user = await prisma.user.create({
            data: { email: email, password: '', id: id, emailVerified: false },
        });
        return user;
    } else {
        return userCount;
    }
};
