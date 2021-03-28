// api/server.ts

import { PrismaClient } from '@prisma/client';
import { ApolloServer } from 'apollo-server-express';
import { applyMiddleware } from 'graphql-middleware';
import express from 'express';
import { userFromRequest } from './utils/authUtils';
import simpleMock from './lib/mocks/mock';
import permissions from './lib/permissions';
import { schema } from './schema';
import 'dotenv/config';

const PORT = parseInt(process.env.PORT || '') || 4000;

const isMocking = process.env.MOCKING == 'true';
const isDev = process.env.NODE_ENV == 'development';

const initServer = async () => {
    const app = express();
    // Connect to database
    const prisma = new PrismaClient({ log: isDev ? ['query'] : undefined });
    if (!isMocking) await prisma.$connect();

    const protectedSchema = applyMiddleware(schema, permissions);
    const server = new ApolloServer({
        context: async ({ req }) => {
            const userId = await userFromRequest(req);
            return { userId, prisma };
        },
        schema: protectedSchema,
        mocks: isMocking && simpleMock,
        tracing: isDev,
    });

    server.applyMiddleware({ app, path: '/' });

    app.listen(PORT, () => {
        console.log(`🚀 Server ready at port: ${PORT}`);
    });
};
initServer();
