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
export const saveAuth0UserIfNotExist = async (prisma: PrismaClient, userId: string, authHeader?: string) => {
    const userCount = await prisma.user.count({ where: { id: userId } });
    if (userCount == 0 && authHeader) {
        const request = await axios.get<Auth0Profile>(`https://${process.env.AUTH0_DOMAIN}/userinfo`, {
            headers: {
                Authorization: authHeader,
                'Content-Type': 'application/json',
            },
        });
        const profile = request.data;
        await prisma.user.create({
            data: { email: profile.email, password: '', id: userId, emailVerified: false },
        });
    }
};
