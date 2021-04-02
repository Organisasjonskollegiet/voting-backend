import { PrismaClient } from '@prisma/client';
import { createApollo, createGraphqlServer } from './server';
import { useServer } from 'graphql-ws/lib/use/ws';
import ws from 'ws';
import { protectedSchema } from './schema';

const PORT = parseInt(process.env.PORT || '') || 4000;

const prisma = new PrismaClient();
const apollo = createApollo(prisma);
const app = createGraphqlServer(apollo, prisma);

app.then((expressServer) => {
    const server = expressServer.listen(PORT, () => {
        console.log(`🚀 GraphQL service ready at http://localhost:${PORT}/graphql`);

        const wsServer = new ws.Server({
            server,
            path: '/graphql',
        });
        useServer({ schema: protectedSchema }, wsServer);
    });
});
