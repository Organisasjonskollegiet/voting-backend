// api/schema.ts

import { makeSchema } from "nexus";

import { join } from "path";

const generated_path = "../../__generated__";
export const schema = makeSchema({
  types: [], // 1
  outputs: {
    typegen: join(__dirname, generated_path, "nexus-typegen.ts"), // 2
    schema: join(__dirname, generated_path, "schema.graphql"), // 3
  },
});
