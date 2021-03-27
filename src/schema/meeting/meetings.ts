import { extendType, list, nonNull, objectType, stringArg } from 'nexus';
import { Meeting as MeetingType } from '@prisma/client';
import { User } from '../auth/user';
import { Votation, Status } from '../votation/votation';
import { Participant } from './participant';

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
                const user = await ctx.prisma.user.findUnique({ where: { id: ownerId }, rejectOnNotFound: true });
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
        t.nonNull.field('meetings', {
            type: list(Meeting),
            description: 'Find meetings you are participating in',
            resolve: async (_, __, ctx) => {
                const meetings = await ctx.prisma.meeting.findMany({
                    where: { participants: { some: { userId: ctx.userId } } },
                });
                return meetings;
            },
        });
        t.nonNull.field('meetingsById', {
            type: Meeting,
            description: 'Find a meeting by id from YOUR meetings',
            args: {
                meetingId: nonNull(stringArg()),
            },
            resolve: async (_, { meetingId }, ctx) => {
                const meeting = await ctx.prisma.meeting.findFirst({
                    where: { id: meetingId, participants: { some: { userId: ctx.userId } } },
                    rejectOnNotFound: true,
                });
                return meeting;
            },
        });
    },
});
