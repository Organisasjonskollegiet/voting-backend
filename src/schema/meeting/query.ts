import { list, nonNull, queryField, stringArg } from 'nexus';
import { Meeting, ParticipantOrInvite } from './';

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

export const MeetingByIdQuery = queryField('meetingById', {
    type: Meeting,
    description: 'Find a meeting by id from meetings youre participating in',
    args: {
        meetingId: nonNull(stringArg()),
    },
    resolve: async (_, { meetingId }, ctx) => {
        const meeting = await ctx.prisma.meeting.findFirst({
            where: { id: meetingId, participants: { some: { userId: ctx.userId } } },
        });
        return meeting;
    },
});

export const GetParticipants = queryField('participants', {
    type: list(ParticipantOrInvite),
    description: 'Return relevant information about invites and participants connected to meeting',
    args: {
        meetingId: nonNull(stringArg()),
    },
    resolve: async (_, { meetingId }, ctx) => {
        const participants = await ctx.prisma.participant.findMany({
            select: {
                role: true,
                isVotingEligible: true,
                user: true,
            },
            where: {
                meetingId,
            },
        });
        const invites = await ctx.prisma.invite.findMany({
            where: {
                meetingId,
            },
        });
        return [
            ...participants.map((participant) => {
                return {
                    email: participant.user.email,
                    role: participant.role,
                    isVotingEligible: participant.isVotingEligible,
                    userExists: true,
                };
            }),
            ...invites.map((invite) => {
                return {
                    email: invite.email,
                    role: invite.role,
                    isVotingEligible: invite.isVotingEligible,
                    userExists: false,
                };
            }),
        ];
    },
});
