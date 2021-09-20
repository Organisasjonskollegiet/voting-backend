// api/server.ts

import { PrismaClient } from '@prisma/client';
import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import simpleMock from './lib/mocks/mock';
import { protectedSchema } from './schema';
import cors from 'cors';
import 'dotenv/config';
import { Context } from './context';
import { checkJwt, DecodedToken } from './lib/auth/verifyToken';
import { saveAuth0UserIfNotExist } from './utils/save_user_locally';

export const createApollo = (prisma: PrismaClient) => {
    const server = new ApolloServer({
        context: async ({ req }): Promise<Context> => {
            if (req.user) {
                const decodedToken = req.user as DecodedToken;
                const userId = decodedToken.sub.split('|')[1];
                if (process.env.NODE_ENV != 'production') {
                    await saveAuth0UserIfNotExist(prisma, userId, req.headers['authorization']);
                }
                return { userId: userId, prisma };
            }
            return { userId: '', prisma };
        },
        schema: protectedSchema,
        mocks: process.env.MOCKING == 'true' && simpleMock,
        tracing: process.env.NODE_ENV == 'development',
    });
    return server;
};

const allowedOrigins = ['https://ecclesia.netlify.app', 'https://vaas.azurewebsites.net'];

export const createGraphqlServer = async (server: ApolloServer, prisma: PrismaClient) => {
    const app = express();
    app.use(
        cors({
            origin: (origin, callback) => {
                if (process.env.NODE_ENV == 'development') {
                    allowedOrigins.push('http://localhost:4000');
                }
                // allow requests with no origin
                // (like mobile apps or curl requests)
                if (!origin) return callback(null, true);
                // Either in the list of allowed origins, a preview deployment from netlify or on localhost
                if (allowedOrigins.includes(origin) || origin.match(/https:\/\/([\w-]+)--ecclesia.netlify.app/g)) {
                    callback(null, true);
                } else {
                    const msg = 'The CORS policy for this site does not ' + 'allow access from the specified Origin.';
                    return callback(new Error(msg), false);
                }
            },
        })
    );
    app.use(checkJwt);

    if (process.env.MOCKING != 'true') await prisma.$connect();
    // Connect to database
    if (process.env.NODE_ENV != 'development') await prisma.$connect();
    // We need to turn the express app into an httpserver to use websockets.
    // We also overwrite  Apollo Server's inbult cors
    server.applyMiddleware({ app, path: '/graphql', cors: false });
    return app;
};
