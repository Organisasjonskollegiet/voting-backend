import { extendType, list, objectType } from "nexus";

export const UserType = objectType({
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
    t.field("users", {
      type: list(UserType),
      resolve: (root, args, ctx) => {
        return ctx.prisma.user.findMany();
      },
    });
  },
});
