import { PrismaClient, User } from '@prisma/client';

export interface Context {
    prisma: PrismaClient;
    userId: String;
}
