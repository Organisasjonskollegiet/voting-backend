import { extendType, list, nonNull, objectType, stringArg } from 'nexus';
import { Meeting as MeetingType } from '@prisma/client';
import { Participant, User } from '../auth/user';
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
        t.nonNull.field('participants', {
            type: list(Participant),
            resolve: async (source, __, ctx) => {
                const { id } = source as MeetingType;
                const participants = await ctx.prisma.participant.findMany({
                    where: {
                        meetingId: id,
                    },
                });
                return participants;
            },
        });
    },
});
export const MeetingQuery = extendType({
    type: 'Query',
    definition: (t) => {
        t.nonNull.field('meetings_for_user', {
            // Also possible to write `type: list(Meeting)` and remove it from the `t` part
            type: list(Meeting),
            resolve: async (_, __, ctx) => {
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
        t.nonNull.field('meetings_for_user_by_id', {
            type: Meeting,
            args: {
                id: nonNull(stringArg()),
            },
            resolve: async (_, { id }, ctx) => {
                const meetingForUser = await ctx.prisma.participant.findFirst({
                    select: {
                        meeting: true,
                    },
                    where: {
                        meetingId: id,
                        userId: ctx.userId,
                    },
                });
                if (!meetingForUser) throw new Error('No meeting with this id for this user.');
                return meetingForUser.meeting;
            },
        });
    },
});
