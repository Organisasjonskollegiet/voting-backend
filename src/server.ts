// api/server.ts

import { PrismaClient } from '@prisma/client';
import { ApolloServer } from 'apollo-server';
import simple_mock from './mocks/mock';
import { DecodedToken } from './types/types';

import { verifyToken } from './utils/verifyToken';
import { schema } from './schema/schema';

const isMocking = process.env.MOCKING == 'true';

const init_server = async () => {
    // Connect to database
    const prisma = new PrismaClient({ log: ['query'] });
    if (!isMocking) await prisma.$connect();

    const server = new ApolloServer({
        context: async ({ req }) => {
            let isAuthenticated;
            let userId;
            try {
                const authHeader = req.headers.authorization || '';
                if (authHeader) {
                    const token = authHeader.split(' ')[1];
                    const payload = (await verifyToken(token)) as DecodedToken;
                    userId = payload.sub;
                    isAuthenticated = payload ? true : false;
                }
            } catch (error) {
                console.log(error);
            }
            return { auth: { isAuthenticated }, userId, prisma };
        },
        schema,
        mocks: isMocking && simple_mock,
        tracing: process.env.NODE_ENV == 'development',
    });

    server.listen().then(({ url }) => {
        console.log(`🚀 Server ready at ${url}`);
    });
};
init_server();
