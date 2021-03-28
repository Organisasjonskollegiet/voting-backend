import { nonNull, mutationField } from 'nexus';
import { AddUserInputType, User } from './';

export const AddUserMutation = mutationField('addUser', {
    type: User,
    args: { user: nonNull(AddUserInputType) },
    resolve: async (_, args, ctx) => {
        const { email, username, id } = args.user;
        const user = await ctx.prisma.user.create({
            data: { id: id || undefined, username, email },
        });
        return user;
    },
});
