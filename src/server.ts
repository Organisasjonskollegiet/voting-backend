// api/server.ts

import { PrismaClient } from "@prisma/client";
import { ApolloServer } from "apollo-server";
import { stitchSchemas } from "@graphql-tools/stitch";
import { authSchema } from "./schema";
import simple_mock from "./mocks/mock";

export const schema = stitchSchemas({
  subschemas: [authSchema],
});

const init_server = async () => {
  // Connect to database
  const prisma = new PrismaClient();
  await prisma.$connect();

  const server = new ApolloServer({
    context: () => ({ prisma }),
    schema,
    mocks: process.env.MOCKING == "true" && simple_mock,
    tracing: process.env.DEVELOPMENT == "true",
  });

  server.listen().then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
  });
};
init_server();
