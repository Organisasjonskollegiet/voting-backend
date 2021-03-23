// api/server.ts

import { PrismaClient } from '@prisma/client';
import { ApolloServer, IResolvers } from 'apollo-server';
import simple_mock from './mocks/mock';
import { mergeTypeDefs } from '@graphql-tools/merge';
import { authTypeDefs, authResolvers } from './schema/auth/user';
import { meetingResolvers, meetingTypeDefs } from './schema/meeting/meeting';
import { votationResolvers, votationTypeDefs } from './schema/votation/votation';
import { mergeResolvers } from '@graphql-tools/merge';
import { makeExecutableSchema } from '@graphql-tools/schema';
const isMocking = process.env.MOCKING == 'true';
const typeDefs = mergeTypeDefs([authTypeDefs, meetingTypeDefs, votationTypeDefs]);
const resolvers = mergeResolvers([authResolvers, meetingResolvers, votationResolvers]);
const schema = makeExecutableSchema({
    typeDefs,
    resolvers: resolvers as IResolvers,
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
