// api/server.ts

import { PrismaClient } from '@prisma/client';
import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import { userFromRequest } from './lib/auth/getUser';
import simpleMock from './lib/mocks/mock';
import { protectedSchema } from './schema';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import 'dotenv/config';

export const createApollo = (prisma: PrismaClient) => {
    const server = new ApolloServer({
        context: async ({ req }) => {
            const userId = await userFromRequest(req);
            return { userId, prisma };
        },
        schema: protectedSchema,
        mocks: process.env.MOCKING == 'true' && simpleMock,
        tracing: process.env.NODE_ENV == 'development',
        subscriptions: {
            path: '/subscriptions',
        },
    });
    return server;
};

export const createGraphqlServer = async (server: ApolloServer, prisma: PrismaClient) => {
    const app = express();
    app.use(
        cors({
            origin: 'http://localhost:3000',
            credentials: true,
        })
    );
    app.use(cookieParser());
    if (process.env.MOCKING != 'true') await prisma.$connect();
    // Connect to database
    if (process.env.NODE_ENV != 'development') await prisma.$connect();
    // We need to turn the express app into an httpserver to use websockets.
    // We also overwrite  Apollo Server's inbult cors
    server.applyMiddleware({ app, path: '/graphql', cors: false });
    return app;
};
