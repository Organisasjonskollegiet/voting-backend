import { nonNull, mutationField } from 'nexus';
import { AddUserInputType, User } from './';
import bcrypt from 'bcrypt';
import { USER_SELECT_FIELDS } from './utils';

export const CreateUserMutation = mutationField('createUser', {
    type: User,
    args: { user: nonNull(AddUserInputType) },
    resolve: async (_, args, ctx) => {
        const { email, username, id, password } = args.user;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await ctx.prisma.user.create({
            data: { id: id || undefined, username, email, password: hashedPassword },
            select: USER_SELECT_FIELDS,
        });
        return user;
    },
});
