import { queryField, nonNull, idArg } from 'nexus';
import { User } from '.';

export const UserByIdQuery = queryField('user', {
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
