import { PrismaClient } from '@prisma/client';
import { execute, subscribe } from 'graphql';
import { createServer } from 'http';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { protectedSchema } from './schema';
import { createApollo, createGraphqlServer } from './server';

const PORT = parseInt(process.env.PORT || '') || 4000;

const prisma = new PrismaClient();
const apollo = createApollo(prisma);
const app = createGraphqlServer(apollo, prisma);

app.then((expressApp) => {
    const server = createServer(expressApp);

    expressApp.get("/health", (req, res) => res.end("Ok!"));

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

export default app;