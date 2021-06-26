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
 * Rule: The user is an Admin of the meetings that all the votation belongs to
 */
export const isAdminOfVotationsByObjects = rule({ cache: 'strict' })(async (_, { votations }, ctx: Context) => {
    let isAdminOfAllVotations = true;
    for (const votation of votations) {
        const votationFromDB = await ctx.prisma.votation.findUnique({ where: { id: votation.id } });
        if (!votationFromDB) return false;
        isAdminOfAllVotations = isAdminOfAllVotations && (await checkIsAdminOfMeetingId(votationFromDB.meetingId, ctx));
    }
    return isAdminOfAllVotations;
});

/**
 * Rule: The user is Admin of all the meetings connected to the votations whose id is in the array
 */

export const isAdminOfVotationsById = rule({ cache: 'strict' })(async (_, { ids }, ctx: Context) => {
    let isAdminOfAllVotations = true;
    for (const id of ids) {
        const votationFromDB = await ctx.prisma.votation.findUnique({ where: { id } });
        if (!votationFromDB) return false;
        isAdminOfAllVotations = isAdminOfAllVotations && (await checkIsAdminOfMeetingId(votationFromDB.meetingId, ctx));
    }
    return isAdminOfAllVotations;
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
export const isAdminOfVotationByMeetingId = rule({ cache: 'strict' })(async (_, { votation }, ctx: Context) => {
    return await checkIsAdminOfMeetingId(votation.meetingId, ctx);
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
 * Helper function for checking if person is admin of meeting
 */
const checkIsAdminOfMeetingId = async (meetingId: string, ctx: Context) => {
    const particpant = await ctx.prisma.participant.findUnique({
        where: { userId_meetingId: { userId: ctx.userId, meetingId: meetingId } },
    });
    return particpant ? particpant.role === 'ADMIN' : false;
};

/**
 * Rule: The user is Owner of the meeting
 */
export const isOwnerOfMeeting = rule({ cache: 'strict' })(async (_, { id }, ctx: Context) => {
    const meeting = await ctx.prisma.meeting.findUnique({ where: { id } });
    return meeting ? meeting.ownerId === ctx.userId : false;
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
