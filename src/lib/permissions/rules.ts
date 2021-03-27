import { rule } from 'graphql-shield';
import { Context } from '../../context';

export const isAuthenticated = rule({ cache: 'contextual' })(async (_, __, ctx: Context) => {
    return ctx.userId !== null;
});

export const isParticipantOfMeeting = rule({ cache: 'contextual' })(async (_, { meetingId }, ctx: Context) => {
    const participant = ctx.prisma.participant.findFirst({
        where: {
            userId: ctx.userId,
            meetingId,
        },
    });
    return participant !== null;
});

export const isParticipantOfVotation = rule({ cache: 'contextual' })(async (_, { votationId }, ctx: Context) => {
    const votationWithParticipant = await ctx.prisma.votation.findFirst({
        where: {
            id: votationId,
        },
        include: {
            meeting: {
                include: {
                    participants: {
                        where: {
                            userId: ctx.userId,
                        },
                    },
                },
            },
        },
    });
    if (!votationWithParticipant) return false;
    return votationWithParticipant.meeting.participants.length > 0;
});

export const isVotingEligible = rule({ cache: 'contextual' })(async (_, { votationId }, ctx: Context) => {
    const votationWithParticipant = await ctx.prisma.votation.findFirst({
        where: {
            id: votationId,
        },
        include: {
            meeting: {
                include: {
                    participants: {
                        where: {
                            userId: ctx.userId,
                        },
                    },
                },
            },
        },
    });
    if (!votationWithParticipant || votationWithParticipant.meeting.participants.length === 0) return false;
    return votationWithParticipant.meeting.participants[0].isVotingEligible;
});
