import { GraphQLClient } from 'graphql-request';
import getPort, { makeRange } from 'get-port';
import { createGraphqlServer } from '../../server';
import { Server } from 'http';

type TestContext = {
    client: GraphQLClient;
};

export function createTestContext(): TestContext {
    let ctx = {} as TestContext;
    const graphqlCtx = graphqlTestContext();
    beforeEach(async () => {
        const client = await graphqlCtx.before();
        Object.assign(ctx, {
            client,
        });
    });

    afterEach(async () => {
        await graphqlCtx.after();
    });
    return ctx;
}

function graphqlTestContext() {
    let serverInstance: Server | null = null;

    return {
        async before() {
            const port = await getPort({ port: makeRange(4000, 6000) }); // 4
            const server = await createGraphqlServer(false, false);
            serverInstance = server.listen({ port }); // 5
            return new GraphQLClient(`http://localhost:${port}`); // 6
        },

        async after() {
            serverInstance?.close();
        },
    };
}
