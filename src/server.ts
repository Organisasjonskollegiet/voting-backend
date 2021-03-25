// api/server.ts

import { PrismaClient } from '@prisma/client';
import { ApolloServer } from 'apollo-server';
import { applyMiddleware } from 'graphql-middleware';
import simple_mock from './mocks/mock';
import permissions from './permissions';
import { schema } from './schema/schema';
import { userFromRequest } from './utils/authUtils';

const isMocking = process.env.MOCKING == 'true';

const init_server = async () => {
    // Connect to database
    const prisma = new PrismaClient({ log: ['query'] });
    if (!isMocking) await prisma.$connect();

    const protectedSchema = applyMiddleware(schema, permissions);
    const server = new ApolloServer({
        context: async ({ req }) => {
            const userId = await userFromRequest(req);
            return { userId, prisma };
        },
        schema: protectedSchema,
        mocks: isMocking && simple_mock,
        tracing: process.env.NODE_ENV == 'development',
    });

    server.listen().then(({ url }) => {
        console.log(`🚀 Server ready at ${url}`);
    });
};
init_server();
