import { AuthenticationError } from 'apollo-server-express';
import { rule } from 'graphql-shield';
import { Context } from '../../context';
import { Status } from '../../schema/enums';

/**
 * Helper function for checking if person is admin of meeting
 */
const checkIsAdminOfMeetingId = async (meetingId: string, ctx: Context) => {
    const particpant = await ctx.prisma.participant.findUnique({
        where: { userId_meetingId: { userId: ctx.userId, meetingId: meetingId } },
    });
    return particpant ? particpant.role === 'ADMIN' : false;
};

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
 * Rule: The user is an Counter of the meeting
 */
export const isCounterOfMeeting = rule({ cache: 'strict' })(async (_, { meetingId }, ctx: Context) => {
    const particpant = await ctx.prisma.participant.findUnique({
        where: { userId_meetingId: { userId: ctx.userId, meetingId } },
    });
    return particpant ? particpant.role === 'COUNTER' : false;
});

/**
 * Rule: The user is an Admin of the meeting where meeting id is input parameter
 */
export const isAdminOfMeetingId = rule({ cache: 'strict' })(async (_, { meetingId }, ctx: Context) => {
    return await checkIsAdminOfMeetingId(meetingId, ctx);
});

/**
 * Rule: The user is an Admin of the meeting where meeting object is input parameter
 */
export const isAdminOfMeetingByObject = rule({ cache: 'strict' })(async (_, { meeting }, ctx: Context) => {
    return await checkIsAdminOfMeetingId(meeting.id, ctx);
});

/**
 * Rule: The user is an Admin of the meeting that the votation belongs to
 */
export const isAdminOfVotationById = rule({ cache: 'strict' })(async (_, { id }, ctx: Context) => {
    const votationFromDB = await ctx.prisma.votation.findUnique({ where: { id } });
    if (!votationFromDB) return false;
    return await checkIsAdminOfMeetingId(votationFromDB.meetingId, ctx);
});

/**
 * Rule: The user is an Admin of the meeting that the votation belongs to
 */
export const isAdminOfVotationByObject = rule({ cache: 'strict' })(async (_, { votation }, ctx: Context) => {
    const votationFromDB = await ctx.prisma.votation.findUnique({ where: { id: votation.id } });
    if (!votationFromDB) return false;
    return await checkIsAdminOfMeetingId(votationFromDB.meetingId, ctx);
});

/**
 * Rule: The user is an Admin of the meeting that the votation belongs to
 */
export const isAdminOfVotationByMeetingId = rule({ cache: 'strict' })(async (_, { votation }, ctx: Context) => {
    return await checkIsAdminOfMeetingId(votation.meetingId, ctx);
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
 * Rule: The user is Owner of the meeting
 */
export const isOwnerOfMeeting = rule({ cache: 'strict' })(async (_, { id }, ctx: Context) => {
    const meeting = await ctx.prisma.meeting.findUnique({ where: { id } });
    return meeting ? meeting.ownerId === ctx.userId : false;
});

/**
 * Rule: Check that the user can vote. Checks that he is participant, is voting eligible and has not already voted
 */
export const userCanVote = rule({ cache: 'contextual' })(async (_, { alternativeId }, ctx: Context) => {
    const alternative = await ctx.prisma.alternative.findUnique({
        where: {
            id: alternativeId,
        },
    });
    if (!alternative) return false;
    const votation = await ctx.prisma.votation.findUnique({
        where: {
            id: alternative.votationId,
        },
    });
    if (!votation) return false;
    const participant = await ctx.prisma.participant.findUnique({
        where: {
            userId_meetingId: {
                userId: ctx.userId,
                meetingId: votation?.meetingId,
            },
        },
    });
    const hasVoted =
        (await ctx.prisma.hasVoted.count({
            where: {
                userId: ctx.userId,
                votationId: alternative.votationId,
            },
        })) > 0;
    return !!participant && votation.status === 'ONGOING' && !hasVoted && participant.isVotingEligible;
});
