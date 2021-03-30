import { queryField, nonNull, idArg, stringArg } from 'nexus';
import { User } from '.';
import { UserQueryResult } from './typedefs';
import { EXPOSED_USER_FIELDS } from './utils';

export const UserByIdQuery = queryField('user', {
    type: UserQueryResult,
    args: {
        id: nonNull(idArg()),
    },
    resolve: async (_, { id }, ctx) => {
        const user = await ctx.prisma.user.findUnique({
            where: { id },
            select: EXPOSED_USER_FIELDS,
        });
        if (!user) return { __typename: 'UserNotFoundError', message: ' No such user found with the provided ID' };
        return { __typename: 'User', ...user };
    },
});

export const UserByEmailQuery = queryField('userByEmail', {
    type: UserQueryResult,
    args: {
        email: nonNull(stringArg()),
    },
    resolve: async (_, { email }, ctx) => {
        const user = await ctx.prisma.user.findUnique({
            select: EXPOSED_USER_FIELDS,
            where: { email },
        });
        if (!user) return { __typename: 'UserNotFoundError', message: 'No such user found with the provided email' };
        return { __typename: 'User', ...user };
    },
});
