// api/server.ts

import { PrismaClient } from '@prisma/client';
import { ApolloServer } from 'apollo-server-express';
import { applyMiddleware } from 'graphql-middleware';
import simple_mock from './mocks/mock';
import permissions from './permissions';
import { schema } from './schema/schema';
import { userFromRequest } from './utils/authUtils';
import express from 'express';

const PORT = parseInt(process.env.PORT || '') || 4000;

const isMocking = process.env.MOCKING == 'true';

const init_server = async () => {
    const app = express();
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

    server.applyMiddleware({ app, path: '/' });

    app.listen(PORT, () => {
        console.log(`🚀 Server ready at port: ${PORT}`);
    });
};
init_server();
