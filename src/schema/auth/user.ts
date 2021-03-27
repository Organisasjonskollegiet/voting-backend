import { extendType, list, nonNull, objectType, stringArg, enumType } from 'nexus';
import { Participant as ParticipantType } from '@prisma/client';
import { Meeting } from '../meeting/meetings';

export const Role = enumType({
    name: 'Role',
    members: ['ADMIN', 'PARTICIPANT', 'COUNTER'],
});

export const Participant = objectType({
    name: 'Participant',
    definition(t) {
        t.nonNull.field('role', { type: Role });
        t.nonNull.boolean('isVotingEligible');
        t.nonNull.field('user', {
            type: User,
            resolve: async (source, __, ctx) => {
                const { userId } = source as ParticipantType;
                const user = await ctx.prisma.user.findUnique({ where: { id: userId } });
                if (!user) throw new Error('User not found');
                return user;
            },
        });
        t.nonNull.field('meeting', {
            type: Meeting,
            resolve: async (source, __, ctx) => {
                const { meetingId } = source as ParticipantType;
                const meeting = await ctx.prisma.meeting.findUnique({ where: { id: meetingId } });
                if (!meeting) throw new Error('No meeting with this id');
                return meeting;
            },
        });
    },
});

export const User = objectType({
    name: 'User',
    definition(t) {
        // t.model = kommer fra nexus-prisma-plugin. Biblioteket har vært litt stale pga rewrite
        // Pluginen lager mapper prisma
        // t.model.id();
        // t.model.username();
        // t.model.email();
        // Evt kan vi definere graphql typene manuelt
        t.nonNull.id('id');
        t.nonNull.string('username');
        t.nonNull.string('email');
    },
});

export const UserQuery = extendType({
    type: 'Query',
    definition: (t) => {
        t.nonNull.field('users', {
            type: list(User),
            resolve: async (_, __, ctx) => {
                const users = await ctx.prisma.user.findMany();
                return users;
            },
        });
        t.nonNull.field('user', {
            type: User,
            args: {
                id: nonNull(stringArg()),
            },
            resolve: async (_, { id }, ctx) => {
                const user = await ctx.prisma.user.findUnique({
                    where: {
                        id,
                    },
                });
                if (!user) throw new Error('No user with this id');
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
                username: nonNull(stringArg()),
                email: nonNull(stringArg()),
            },
            // args typen i resolver er mappa til args typen definnert over
            resolve: async (_, args, ctx) => {
                const user = await ctx.prisma.user.create({ data: { id: ctx.userId, ...args } });
                return user;
            },
        });
    },
});
