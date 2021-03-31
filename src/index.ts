import { PrismaClient } from '@prisma/client';
import { createApollo, createGraphqlServer } from './server';

const PORT = parseInt(process.env.PORT || '') || 4000;

const prisma = new PrismaClient({ log: ['query'] });
const apollo = createApollo(prisma);
const app = createGraphqlServer(apollo, prisma);

app.then((server) =>
    server.listen(PORT, () => {
        console.log(`🚀 GraphQL service ready at http://localhost:${PORT}/graphql`);
    })
);
