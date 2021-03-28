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
import { createServer } from 'http';

export const createGraphqlServer = async (isMocking: boolean, isDev: boolean) => {
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
        subscriptions: {
            path: '/subscriptions',
        },
    });
    // We need to turn the express app into an httpserver to use websockets
    const ws = createServer(app);

    server.applyMiddleware({ app, path: '/graphql' });
    server.installSubscriptionHandlers(ws);
    return ws;
};
