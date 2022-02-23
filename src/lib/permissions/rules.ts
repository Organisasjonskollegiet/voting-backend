import { Role, Votation, VotationStatus } from '.prisma/client';
import { AuthenticationError } from 'apollo-server-express';
import { or, rule } from 'graphql-shield';
import { Context } from '../../context';
import { canUserVoteOnVotation } from './utils';

/**
 * Helper function for checking if person is admin of meeting
 */
const checkIsRoleOfMeetingId = async (meetingId: string, role: Role, ctx: Context) => {
    const particpant = await ctx.prisma.participant.findUnique({
        where: { userId_meetingId: { userId: ctx.userId, meetingId: meetingId } },
    });
    return particpant ? particpant.role === role : false;
};

const checkIsAdminOfAlternative = async (id: string, ctx: Context) => {
    const votation = await ctx.prisma.votation.findFirst({
        where: {
            alternatives: { some: { id } },
        },
    });
    if (!votation) return false;
    return await checkIsRoleOfMeetingId(votation.meetingId, Role.ADMIN, ctx);
};

const checkIfUserCanVote = async (votationId: string, ctx: Context) => {
    const votation = await ctx.prisma.votation.findUnique({
        where: {
            id: votationId,
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
                votationId: votationId,
            },
        })) > 0;
    return !!participant && votation.status === 'OPEN' && !hasVoted && participant.isVotingEligible;
};

export const isAuthenticated = rule({ cache: 'contextual' })(async (_, __, ctx: Context) => {
    return ctx.userId ? true : new AuthenticationError('User must be logged in');
});

/**
 * The user has to be a participant of the meeting in @args
 */
export const isParticipantOfMeeting = rule({ cache: 'contextual' })(async (_, { meetingId }, ctx: Context) => {
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
 * Rule: The meeting allows self registration
 */
export const meetingAllowsSelfRegistration = rule({ cache: 'contextual' })(async (_, { meetingId }, ctx: Context) => {
    const meeting = await ctx.prisma.meeting.findUnique({
        where: { id: meetingId },
    });
    return meeting ? meeting.allowSelfRegistration : false;
});

/**
 * Rule: The user is an Counter of the meeting
 */
export const isCounterOfVotationById = rule({ cache: 'strict' })(async (_, { votationId }, ctx: Context) => {
    const votationFromDB = await ctx.prisma.votation.findUnique({ where: { id: votationId } });
    if (!votationFromDB) return false;
    const isCounter = await checkIsRoleOfMeetingId(votationFromDB.meetingId, Role.COUNTER, ctx);
    return isCounter;
});

/**
 * Rule: The user is an Admin of the meeting that the alternative with id belongs to
 */
export const isAdminOfAlternative = rule({ cache: 'strict' })(async (_, { id }, ctx: Context) => {
    return await checkIsAdminOfAlternative(id, ctx);
});

/**
 * Rule: The user is an Admin of the meeting that the alternatives with ids belongs to
 */
export const isAdminOfAlternatives = rule({ cache: 'strict' })(async (_, { ids }, ctx: Context) => {
    let isAdminOfAllAlternatives = true;
    for (const id of ids) {
        isAdminOfAllAlternatives = isAdminOfAllAlternatives && (await checkIsAdminOfAlternative(id, ctx));
    }
    return isAdminOfAllAlternatives;
});

/**
 * Rule: The user is an Admin of the meetings that all the votation belongs to
 */
export const isAdminOfVotationsByObjects = rule({ cache: 'strict' })(async (_, { votations }, ctx: Context) => {
    let isAdminOfAllVotations = true;
    for (const votation of votations) {
        const votationFromDB = await ctx.prisma.votation.findUnique({ where: { id: votation.id } });
        if (!votationFromDB) return false;
        isAdminOfAllVotations =
            isAdminOfAllVotations && (await checkIsRoleOfMeetingId(votationFromDB.meetingId, Role.ADMIN, ctx));
    }
    return isAdminOfAllVotations;
});

/**
 * Rule: The votations provided belong to meeting provided
 */
export const votationsBelongToMeeting = rule({ cache: 'strict' })(async (_, { votations, meetingId }, ctx: Context) => {
    let votationsBelongToMeeting = true;
    for (const votation of votations) {
        const votationFromDB = await ctx.prisma.votation.findUnique({ where: { id: votation.id } });
        if (!votationFromDB) return false;
        votationsBelongToMeeting = votationsBelongToMeeting && votationFromDB.meetingId === meetingId;
    }
    return votationsBelongToMeeting;
});

/**
 * Rule: The votations have status Upcoming
 */
export const votationsAreUpcoming = rule({ cache: 'strict' })(async (_, { votations }, ctx: Context) => {
    for (const votation of votations) {
        const votationFromDB = await ctx.prisma.votation.findUnique({ where: { id: votation.id } });
        if (!votationFromDB || votationFromDB.status !== VotationStatus.UPCOMING) return false;
    }
    return true;
});

/**
 * Rule: The user is an Admin of the meeting that the votation belongs to
 */
export const isAdminOfVotationById = rule({ cache: 'strict' })(async (_, { votationId }, ctx: Context) => {
    const votationFromDB = await ctx.prisma.votation.findUnique({ where: { id: votationId } });
    if (!votationFromDB) return false;
    return await checkIsRoleOfMeetingId(votationFromDB.meetingId, Role.ADMIN, ctx);
});

/**
 * Rule: The user is an Admin of the meeting that the votation belongs to
 */
export const isAdminOfVotationByObject = rule({ cache: 'strict' })(async (_, { votation }, ctx: Context) => {
    const votationFromDB = await ctx.prisma.votation.findUnique({ where: { id: votation.id } });
    if (!votationFromDB) return false;
    return await checkIsRoleOfMeetingId(votationFromDB.meetingId, Role.ADMIN, ctx);
});

/**
 * Rule: The user is an Admin of the meeting where meeting id is input parameter
 */
export const isAdminOfMeetingId = rule({ cache: 'strict' })(async (_, { meetingId }, ctx: Context) => {
    return await checkIsRoleOfMeetingId(meetingId, Role.ADMIN, ctx);
});

/**
 * Rule: The user is an Admin of the meeting where meeting object is input parameter
 */
export const isAdminOfMeetingByObject = rule({ cache: 'strict' })(async (_, { meeting }, ctx: Context) => {
    return await checkIsRoleOfMeetingId(meeting.id, Role.ADMIN, ctx);
});

/**
 * Rule: The user is Owner of the meeting
 */
export const isOwnerOfMeeting = rule({ cache: 'strict' })(async (_, { id }, ctx: Context) => {
    const meeting = await ctx.prisma.meeting.findUnique({ where: { id } });
    return meeting ? meeting.ownerId === ctx.userId : false;
});

export const userCanVoteOnVotation = rule({ cache: 'contextual' })(async (_, { votationId }, ctx: Context) => {
    const canVote = await canUserVoteOnVotation(votationId, ctx);
    return canVote;
});

/**
 * Rule: Check that the user can vote. Checks that he is participant, is voting eligible and has not already voted
 */
export const userCanVoteOnAlternative = rule({ cache: 'contextual' })(async (_, { alternativeId }, ctx: Context) => {
    const alternative = await ctx.prisma.alternative.findUnique({ where: { id: alternativeId } });
    if (!alternative) return false;
    const canVote = await canUserVoteOnVotation(alternative.votationId, ctx);
    return canVote;
});

/**
 * Rule: The user is an Admin of the meeting that the votation belongs to
 */
export const resultIsPublished = rule({ cache: 'strict' })(async (_, { votationId }, ctx: Context) => {
    const votationFromDB = await ctx.prisma.votation.findUnique({ where: { id: votationId } });
    if (!votationFromDB) return false;
    return votationFromDB.status === 'PUBLISHED_RESULT';
});

/**
 * Rule: The user is an Admin of the meeting that the votation belongs to
 */
export const votesNotHidden = rule({ cache: 'strict' })(async (_, { votationId }, ctx: Context) => {
    const votationFromDB = await ctx.prisma.votation.findUnique({ where: { id: votationId } });
    if (!votationFromDB) return false;
    return !votationFromDB.hiddenVotes;
});
