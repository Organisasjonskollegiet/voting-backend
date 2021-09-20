import { PrismaClient } from '@prisma/client';
import { createApollo, createGraphqlServer } from './server';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { protectedSchema } from './schema';
import { execute, subscribe } from 'graphql';
import { createServer } from 'http';

const PORT = parseInt(process.env.PORT || '') || 4000;

const prisma = new PrismaClient();
const apollo = createApollo(prisma);
const app = createGraphqlServer(apollo, prisma);

app.then((expressApp) => {
    const server = createServer(expressApp);
    server.listen(PORT, () => {
        console.log(`🚀 GraphQL service ready at http://localhost:${PORT}/graphql`);
        console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}${apollo.subscriptionsPath}`);
        new SubscriptionServer(
            {
                execute,
                subscribe,
                schema: protectedSchema,
            },
            {
                server: server,
                path: '/graphql',
            }
        );
    });
});
