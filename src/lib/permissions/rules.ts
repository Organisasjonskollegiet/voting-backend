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
export const is_voting_eligible = rule({ cache: 'contextual' })(async (_, { meetingId }, ctx: Context) => {
    const particpant = await ctx.prisma.participant.findUnique({
        where: { userId_meetingId: { userId: ctx.userId, meetingId } },
    });
    return particpant ? particpant.isVotingEligible : false;
});

/**
 * Rule: The user is an Admin of the meeting that the alternative with id belongs to
 */
export const isAdminOfAlternative = rule({ cache: 'strict' })(async (_, { id }, ctx: Context) => {
    const votation = await ctx.prisma.votation.findFirst({
        where: {
            alternatives: { some: { id } },
        },
    });
    if (!votation) return false;
    return await checkIsAdminOfMeetingId(votation.meetingId, ctx);
});

/**
 * Rule: The user is an Admin of the meeting that the votation belongs to
 */
export const isAdminOfVotation = rule({ cache: 'strict' })(async (_, { votation }, ctx: Context) => {
    return await checkIsAdminOfMeetingId(votation.meetingId, ctx);
});

/**
 * Rule: The user is an Admin of the meeting where meeting id is input parameter
 */
export const isAdminOfMeetingById = rule({ cache: 'strict' })(async (_, { meetingId }, ctx: Context) => {
    return await checkIsAdminOfMeetingId(meetingId, ctx);
});

/**
 * Rule: The user is an Admin of the meeting where meeting object is input parameter
 */
export const isAdminOfMeetingByObject = rule({ cache: 'strict' })(async (_, { meeting }, ctx: Context) => {
    return await checkIsAdminOfMeetingId(meeting.id, ctx);
});

/**
 * Helper function for checking if person is admin of meeting
 */
const checkIsAdminOfMeetingId = async (meetingId: string, ctx: Context) => {
    const particpant = await ctx.prisma.participant.findUnique({
        where: { userId_meetingId: { userId: ctx.userId, meetingId: meetingId } },
    });
    return particpant ? particpant.role === 'ADMIN' : false;
};

/**
 * Rule: The user is an Counter of the meeting
 */
export const isCounterOfMeeting = rule({ cache: 'strict' })(async (_, { meetingId }, ctx: Context) => {
    const particpant = await ctx.prisma.participant.findUnique({
        where: { userId_meetingId: { userId: ctx.userId, meetingId } },
    });
    return particpant ? particpant.role === 'COUNTER' : false;
});
