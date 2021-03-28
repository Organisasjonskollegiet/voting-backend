import { createGraphqlServer } from './server';

const PORT = parseInt(process.env.PORT || '') || 4000;
const isMocking = process.env.MOCKING == 'true';
const isDev = process.env.NODE_ENV == 'development';

const app = createGraphqlServer(isMocking, isDev);

app.then((server) =>
    server.listen(PORT, () => {
        console.log(`🚀 GraphQL service ready at http://localhost:${PORT}/graphql`);
    })
);
