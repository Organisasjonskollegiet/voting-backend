import { ManagementClient } from 'auth0';
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

export const UpdatePasswordLinkQuery = queryField('updateMyPassword', {
    type: 'String',
    description: 'Provides a ticket to change Auth0 password.',
    args: {},
    resolve: async (_, __, ctx) => {
        const auth0 = new ManagementClient({
            domain: process.env.AUTH0_DOMAIN!,
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            // scope: 'delete:users'
        });

        const res = auth0.createPasswordChangeTicket({
            user_id: `auth0|${ctx.userId}`,
            ttl_sec: 1200,
            includeEmailInRedirect: false,
            result_url: process.env.AUTH0_CALLBACK_URL,
        });

        return (await res).ticket;
    },
});
