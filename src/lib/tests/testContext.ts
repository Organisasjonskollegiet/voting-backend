import getPort, { makeRange } from 'get-port';
import { createGraphqlServer } from '../../server';
import { Server } from 'http';
import { PrismaClient, User } from '@prisma/client';
import { join } from 'path';
import { execSync } from 'child_process';
import 'dotenv/config';
import { GraphQLClient } from 'graphql-request';
import { ApolloServer } from 'apollo-server-express';
import { protectedSchema } from '../../schema';

const prisma = new PrismaClient();

type TestContext = {
    client: GraphQLClient;
    prisma: PrismaClient;
    user: User;
};

export const createTestContext = (): TestContext => {
    const ctx = {} as TestContext;
    const graphqlCtx = graphqlTestContext();
    const prismaCtx = prismaTestContext();

    beforeEach(async () => {
        const prisma = await prismaCtx.before();
        const user = await prisma.user.create({ data: { email: 'test@test.com', password: 'hunter2' } });
        const client = await graphqlCtx.before(user);
        Object.assign(ctx, {
            client,
            prisma,
            user,
        });
    });

    afterEach(async () => {
        await graphqlCtx.after();
        await prismaCtx.after();
    });
    return ctx;
};

const graphqlTestContext = () => {
    let serverInstance: Server | null = null;

    return {
        async before(user: User) {
            const port = await getPort({ port: makeRange(4001, 6000) }); // 4
            const apollo = new ApolloServer({
                context: { user, prisma },
                schema: protectedSchema,
                subscriptions: {
                    path: '/subscriptions',
                },
            });
            const server = await createGraphqlServer(apollo, prisma);
            serverInstance = server.listen({ port }); // 5
            serverInstance.on('close', async () => {
                prisma.$disconnect();
            });
            return new GraphQLClient(`http://localhost:${port}/graphql`);
        },
        async after() {
            serverInstance?.close();
        },
    };
};

function prismaTestContext() {
    const prismaBinary = join(__dirname, '../../../', 'node_modules', '.bin', 'prisma');
    let prismaClient: null | PrismaClient = null;

    return {
        async before() {
            // Run the migrations to ensure our schema has the required structure
            execSync(`${prismaBinary} db push --preview-feature`);
            // Construct a new Prisma Client connected to the generated schema
            prismaClient = prisma;
            return prismaClient;
        },

        async after() {
            // Drop the schema after the tests have completed
            execSync(`${prismaBinary} migrate reset --force`);
            // Release the Prisma Client connection
            await prismaClient?.$disconnect();
        },
    };
}
