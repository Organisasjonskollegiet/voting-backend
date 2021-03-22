import { extendType, list, objectType } from "nexus";

export const User = objectType({
  name: "User",
  definition(t) {
    t.nonNull.id("id");
    t.string("username");
    t.string("email");
  },
});

export const UserQuery = extendType({
  type: "Query",
  definition(t) {
    t.nonNull.field("users", {
      type: list(User),
      resolve: async (_, __, ctx) => {
        return ctx.prisma.user.findMany();
      },
    });
  },
});
