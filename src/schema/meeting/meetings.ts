import { extendType, list, objectType } from 'nexus';
import { Meeting as MeetingType } from '@prisma/client';
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
        t.list.field('votations', {
            type: Votation,
            resolve: async (source, __, ctx) => {
                const { id } = source as MeetingType;
                const votation = await ctx.prisma.votation.findMany({ where: { meetingId: id } });
                return votation;
            },
        });
        t.nonNull.field('status', { type: Status });
    },
});
export const MeetingQuery = extendType({
    type: 'Query',
    definition: (t) => {
        t.nonNull.field('meetings_for_user', {
            // Also possible to write `type: list(Meeting)` and remove it from the `t` part
            type: list(Meeting),
            resolve: async (_, __, ctx) => {
                if (!ctx.userId) throw new Error('User cannot be null.');
                const meetingForUser = await ctx.prisma.participant.findMany({
                    select: {
                        meeting: true,
                    },
                    where: {
                        userId: ctx.userId,
                    },
                });
                return meetingForUser.map((meeting) => meeting.meeting);
            },
        });
    },
});
