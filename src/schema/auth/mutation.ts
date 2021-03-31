import { nonNull, mutationField, stringArg } from 'nexus';
import { User } from './';
import bcrypt from 'bcrypt';
import { EXPOSED_USER_FIELDS } from './utils';
import { AddUserInputType } from './typedefs';
import { LoginResult } from './typedefs/results';

export const CreateUserMutation = mutationField('createUser', {
    type: User,
    args: { user: nonNull(AddUserInputType) },
    resolve: async (_, args, ctx) => {
        const { email, password } = args.user;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await ctx.prisma.user.create({
            data: { id: undefined, email, password: hashedPassword },
            select: EXPOSED_USER_FIELDS,
        });
        return user;
    },
});

export const LoginMutation = mutationField('login', {
    type: LoginResult,
    args: { email: nonNull(stringArg()), password: nonNull(stringArg()) },
    resolve: async (_, { email, password }, ctx) => {
        const user = await ctx.prisma.user.findUnique({ where: { email } });
        if (!user) return { __typename: 'UserNotFoundError', message: 'No such user found with this email' };
        const isValidPassword = bcrypt.compareSync(password, user.password);
        return isValidPassword
            ? { __typename: 'User', ...user }
            : { __typename: 'InvalidPasswordError', message: 'The provided password did not match' };
    },
});

export const VerifyUserEmail = mutationField('verifyUserEmail', {
    type: 'Boolean',
    args: { email: nonNull(stringArg()) },
    resolve: async (_, { email }, ctx) => {
        try {
            await ctx.prisma.user.update({ where: { email }, data: { emailVerified: true } });
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    },
});
