// api/server.ts

import { PrismaClient } from "@prisma/client";
import { ApolloServer } from "apollo-server";
import { makeSchema } from "nexus";
import { join } from "path";
import ApiMock from "./mocks/mock";
import * as types from "./schema";

const init_server = async () => {
  // Connect to database
  const prisma = new PrismaClient();
  await prisma.$connect();

  /* Create the schema. Imports types from /schema
   * Paths has to be absolute, and therefor we use __dirname
   */
  const schema = makeSchema({
    types,
    sourceTypes: {
      modules: [{ module: ".prisma/client", alias: "PrismaClient" }],
    },
    contextType: {
      module: require.resolve("./context"),
      export: "Context", // 3
    },
    shouldExitAfterGenerateArtifacts: Boolean(
      process.env.NEXUS_SHOULD_EXIT_AFTER_REFLECTION
    ),
    outputs: {
      typegen: join(__dirname, "../__generated__", "nexus-typegen.ts"),
      schema: join(__dirname, "../__generated__", "schema.graphql"),
    },
  });

  const server = new ApolloServer({
    context: () => ({ prisma }),
    schema,
    mocks: process.env.MOCKING == "true" && ApiMock,
    tracing: process.env.DEVELOPMENT == "true",
  });

  server.listen().then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
  });
};
init_server();
