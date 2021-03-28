import { list, nonNull, queryField, stringArg } from 'nexus';
import { Meeting } from './';

export const MeetingsQuery = queryField('meetings', {
    type: nonNull(list(Meeting)),
    description: 'Find meetings you are participating in',
    resolve: async (_, __, ctx) => {
        const meetings = await ctx.prisma.meeting.findMany({
            where: { participants: { some: { userId: ctx.userId } } },
        });
        return meetings;
    },
});

export const MeetingByIdQuery = queryField('meetingsById', {
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