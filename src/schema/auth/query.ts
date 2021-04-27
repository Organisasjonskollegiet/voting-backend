import { queryField } from 'nexus';
import { GetUserResult } from './typedefs/results';
import { EXPOSED_USER_FIELDS } from './utils';

export const UserQuery = queryField('user', {
    type: GetUserResult,
    resolve: async (_, __, ctx) => {
        const user = await ctx.prisma.user.findUnique({
            where: { id: ctx.userId },
            select: EXPOSED_USER_FIELDS,
        });
        if (!user) return { __typename: 'UserNotFoundError', message: ' No such user found with the provided ID' };
        return { __typename: 'User', ...user };
    },
});
