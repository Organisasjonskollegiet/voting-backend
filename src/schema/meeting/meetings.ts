import { extendType, list, objectType } from 'nexus';
import { Meeting as MeetingType } from '@prisma/client';
import { Context } from '../../context';
import { User } from '../auth/user';
import { Votation, Status } from '../votation/votation';

export const Meeting = objectType({
    name: 'Meeting',
    definition: (t) => {
        t.nonNull.id('id');
        t.nonNull.string('title');
        t.nonNull.string('startTime');
        t.string('description');
        t.nonNull.field('owner', {
            type: User,
            resolve: async (source, __, ctx) => {
                const { ownerId } = source as MeetingType;
                const user = await ctx.prisma.user.findUnique({ where: { id: ownerId } });
                if (!user) throw new Error('User not found');
                return user;
            },
        });
        t.list.field('votations', { type: Votation });
        t.nonNull.field('status', { type: Status });
    },
});
export const MeetingQuery = extendType({
    type: 'Query',
    definition: (t) => {
        t.nonNull.field('meetings', {
            // Also possible to write `type: list(Meeting)` and remove it from the `t` part
            type: list(Meeting),
            resolve: async (_, __, ctx: Context) => {
                const meetings = await ctx.prisma.meeting.findMany();
                return meetings;
            },
        });
    },
});
