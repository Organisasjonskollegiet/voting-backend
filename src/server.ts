// api/server.ts

import { PrismaClient } from '@prisma/client';
import { ApolloServer } from 'apollo-server';
import { stitchSchemas } from '@graphql-tools/stitch';
import { authSchema } from './schema';
import simple_mock from './mocks/mock';
import jwt from 'express-jwt';
import jwtAuthz from 'express-jwt-authz';
import jwksRsa from 'jwks-rsa';

const checkJwt = jwt({
    // Dynamically provide a signing key
    // based on the kid in the header and
    // the signing keys provided by the JWKS endpoint.
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: 'https://dev-4bxg75mo.eu.auth0.com/.well-known/jwks.json',
    }),

    // Validate the audience and the issuer.
    audience: 'https://stemmesystem/api',
    issuer: 'https://dev-4bxg75mo.eu.auth0.com/',
    algorithms: ['RS256'],
});

const isMocking = process.env.MOCKING == 'true';

export const schema = stitchSchemas({
    subschemas: [authSchema],
});

const init_server = async () => {
    // Connect to database
    const prisma = new PrismaClient();
    if (!isMocking) await prisma.$connect();

    const server = new ApolloServer({
        context: () => ({ prisma }),
        schema,
        mocks: isMocking && simple_mock,
        tracing: process.env.DEVELOPMENT == 'true',
    });

    server.listen().then(({ url }) => {
        console.log(`🚀 Server ready at ${url}`);
    });
};
init_server();
