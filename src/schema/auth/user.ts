import { extendType, nonNull, objectType, stringArg, enumType, idArg } from 'nexus';

export const Role = enumType({
    name: 'Role',
    members: ['ADMIN', 'PARTICIPANT', 'COUNTER'],
});

export const User = objectType({
    name: 'User',
    definition(t) {
        t.nonNull.id('id');
        t.nonNull.string('username');
        t.nonNull.string('email');
    },
});

export const UserQuery = extendType({
    type: 'Query',
    definition: (t) => {
        t.nonNull.field('user', {
            type: User,
            args: {
                id: nonNull(idArg()),
            },
            resolve: async (_, { id }, ctx) => {
                const user = await ctx.prisma.user.findUnique({
                    where: {
                        id,
                    },
                    rejectOnNotFound: true,
                });
                return user;
            },
        });
    },
});

export const UserMutation = extendType({
    type: 'Mutation',
    definition: (t) => {
        t.field('addUser', {
            type: User,
            args: {
                id: idArg(),
                username: nonNull(stringArg()),
                email: nonNull(stringArg()),
            },
            resolve: async (_, args, ctx) => {
                const user = await ctx.prisma.user.create({
                    data: { id: args.id || undefined, username: args.username, email: args.email },
                });
                return user;
            },
        });
    },
});
