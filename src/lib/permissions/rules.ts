import { rule } from 'graphql-shield';
import { Context } from '../../context';
import { Votation } from '../../schema/votation/votation';

export const isAuthenticated = rule({ cache: 'contextual' })(async (_, __, ctx: Context) => {
    return ctx.userId !== null;
});

export const isParticipant = rule({ cache: 'contextual' })(async (_, { meetingId }, ctx: Context) => {
    if (!ctx.userId) throw new Error('User cannot be null.');
    const participant = ctx.prisma.participant.findFirst({
        where: {
            userId: ctx.userId,
            meetingId,
        },
    });
    return participant !== null;
});

export const isVotingEligible = rule({ cache: 'contextual' })(async (_, { votationId }, ctx: Context) => {
    if (!ctx.userId) throw new Error('User cannot be null.');
    // logic for checking eligibility
    return true;
});
