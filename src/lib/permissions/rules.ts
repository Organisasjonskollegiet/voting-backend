import { AuthenticationError } from 'apollo-server-express';
import { rule } from 'graphql-shield';
import { Context } from '../../context';

export const isAuthenticated = rule({ cache: 'contextual' })(async (_, __, ctx: Context) => {
    return ctx.userId ? true : new AuthenticationError('User must be logged in');
});

/**
 * The user has to be a participant of the meeting in @args
 */
export const isParticipantOfMeeting = rule({ cache: 'contextual' })(async (_, args, ctx: Context) => {
    const meetingId = args.id;
    const resultCount = await ctx.prisma.participant.count({ where: { userId: ctx.userId, meetingId } });
    return resultCount > 0;
});

/**
 * Rule: A user has to be an participant of the votation
 */
export const isParticipantOfVotation = rule({ cache: 'contextual' })(async (_, { votationId }, ctx: Context) => {
    const resultCount = await ctx.prisma.votation.count({
        where: { id: votationId, meeting: { participants: { some: { user: { id: ctx.userId } } } } },
    });
    return resultCount > 0;
});

/**
 * Rule: A user can vote
 */
export const is_voting_eligible = rule({ cache: 'contextual' })(async (_, { votationId }, ctx: Context) => {
    const particpant = await ctx.prisma.participant.findFirst({
        where: { userId: ctx.userId, meeting: { votations: { some: { id: votationId } } } },
    });
    return particpant ? particpant.isVotingEligible : false;
});

/**
 * Rule: The user is an Admin of the meeting
 */
export const isAdminOfMeeting = rule({ cache: 'strict' })(async (_, { meetingId }, ctx: Context) => {
    const particpant = await ctx.prisma.participant.findFirst({
        where: { meetingId, userId: ctx.userId },
    });
    return particpant ? particpant.role === 'ADMIN' : false;
});

/**
 * Rule: The user is an Counter of the meeting
 */
export const isCounterOfMeeting = rule({ cache: 'strict' })(async (_, { participantId }, ctx: Context) => {
    const particpant = await ctx.prisma.participant.findUnique({
        where: { id: participantId },
    });
    return particpant ? particpant.role === 'COUNTER' : false;
});
