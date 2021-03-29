import { queryField, nonNull, idArg } from 'nexus';
import { User } from '.';
import { USER_SELECT_FIELDS } from './utils';

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
            select: USER_SELECT_FIELDS,
        });
        return user;
    },
});
