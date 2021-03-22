// api/server.ts

import { PrismaClient } from "@prisma/client";
import { ApolloServer } from "apollo-server";
import { stitchSchemas } from "@graphql-tools/stitch";
import ApiMock from "./mocks/mock";
import { authSchema } from "./schema";

const init_server = async () => {
  // Connect to database
  const prisma = new PrismaClient();
  await prisma.$connect();

  const schema = stitchSchemas({
    subschemas: [authSchema],
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
