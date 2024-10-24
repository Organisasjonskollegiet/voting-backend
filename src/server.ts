// api/server.ts

import { PrismaClient } from '@prisma/client';
import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import simpleMock from './lib/mocks/mock';
import { protectedSchema } from './schema';
import 'dotenv/config';
import { Context } from './context';
import { checkJwt, DecodedToken } from './lib/auth/verifyToken';
import { saveAuth0UserIfNotExist } from './utils/save_user_locally';
import cors from 'cors';
import axios from 'axios';
interface Auth0Profile {
    sub: string;
    nickname: string;
    name: string;
    picture: string;
    updated_at: Date;
    email: string;
}

export const createApollo = (prisma: PrismaClient) => {
    const server = new ApolloServer({
        context: async ({ req }): Promise<Context> => {
            if (req.user) {
                const decodedToken = req.user as DecodedToken;
                const userId = decodedToken.sub.split('|')[1];

                const request = await axios.get<Auth0Profile>(`https://${process.env.AUTH0_DOMAIN}/userinfo`, {
                    headers: {
                        Authorization: req.headers['authorization'] as string,
                        'Content-Type': 'application/json',
                    },
                });
                const email = request.data.email;
                const user = await saveAuth0UserIfNotExist(prisma, email, userId);

                return { userId: user.id, email: user.email, prisma };
            }
            return { userId: '', email: '', prisma };
        },
        schema: protectedSchema,
        mocks: process.env.MOCKING == 'true' && simpleMock,
        tracing: process.env.NODE_ENV == 'development',
    });
    return server;
};

export const createGraphqlServer = async (server: ApolloServer, prisma: PrismaClient) => {
    const app = express();
    app.use(checkJwt);
    app.use(cors());
    if (process.env.MOCKING != 'true') await prisma.$connect();
    // Connect to database
    if (process.env.NODE_ENV != 'development') await prisma.$connect();
    // We need to turn the express app into an httpserver to use websockets.
    // We also overwrite  Apollo Server's inbult cors, we set CORS on Azure
    server.applyMiddleware({ app, path: '/graphql', cors: false });
    return app;
};
