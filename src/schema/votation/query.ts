import { idArg, list, nonNull, queryField, stringArg } from 'nexus';
import { Alternative, StvResult, Votation, VotationResults } from './typedefs';
import { VotationStatus } from '@prisma/client';
import { getParticipantId } from './utils';

export const GetVotationById = queryField('votationById', {
    type: Votation,
    args: {
        votationId: nonNull(stringArg()),
    },
    resolve: async (_, { votationId }, ctx) => {
        const votation = await ctx.prisma.votation.findUnique({ where: { id: votationId } });
        if (!votation) throw new Error('Error fetching votation from database');
        return votation;
    },
});

export const GetVoteCount = queryField('getVoteCount', {
    type: 'VoteCountResult',
    args: {
        votationId: nonNull(stringArg()),
    },
    resolve: async (_, { votationId }, ctx) => {
        const meeting = await ctx.prisma.meeting.findFirst({
            where: {
                votations: {
                    some: {
                        id: votationId,
                    },
                },
            },
        });
        const votingEligibleCount = await ctx.prisma.participant.count({
            where: {
                meetingId: meeting?.id,
                isVotingEligible: true,
            },
        });
        const voteCount = await ctx.prisma.hasVoted.count({
            where: {
                votationId,
            },
        });
        return { votingEligibleCount, voteCount };
    },
});

export const GetStvResult = queryField('getStvResult', {
    type: StvResult,
    description: 'Get results from an stv votation',
    args: {
        votationId: nonNull(stringArg()),
    },
    resolve: async (_, { votationId }, ctx) => {
        const votation = await ctx.prisma.votation.findUnique({
            where: {
                id: votationId,
            },
        });
        if (!votation) throw new Error('Votation does not exist.');
        const votingEligibleCount = await ctx.prisma.participant.count({
            where: {
                meetingId: votation.meetingId,
                isVotingEligible: true,
            },
        });
        const voteCount = await ctx.prisma.hasVoted.count({
            where: {
                votationId,
            },
        });
        const stvResult = await ctx.prisma.stvResult.findUnique({
            where: {
                votationId,
            },
        });
        if (!stvResult || !voteCount || !votingEligibleCount) throw new Error('');
        return { ...stvResult, voteCount, votingEligibleCount };
    },
});

export const GetWinnerOfVotation = queryField('getWinnerOfVotation', {
    type: list(Alternative),
    description: '',
    args: {
        votationId: nonNull(stringArg()),
    },
    resolve: async (_, { votationId }, ctx) => {
        return await ctx.prisma.alternative.findMany({
            where: {
                votationId,
                isWinner: true,
            },
        });
    },
});

export const GetVotationResults = queryField('getVotationResults', {
    type: VotationResults,
    description: '',
    args: {
        votationId: nonNull(stringArg()),
    },
    resolve: async (_, { votationId }, ctx) => {
        const votation = await ctx.prisma.votation.findUnique({
            where: {
                id: votationId,
            },
        });
        return votation;
    },
});

export const GetResultsOfPublishedVotations = queryField('resultsOfPublishedVotations', {
    type: list('VotationWithWinner'),
    description: 'Return the results of all the votations with votationStatus === "PUBLISHED_RESULT" of that meeting',
    args: {
        meetingId: nonNull(stringArg()),
    },
    resolve: async (_, { meetingId }, ctx) => {
        const votations = await ctx.prisma.votation.findMany({
            where: {
                meetingId,
                status: VotationStatus.PUBLISHED_RESULT,
            },
        });
        return votations;
    },
});

export const GetOpenVotation = queryField('getOpenVotation', {
    type: 'String',
    description: '',
    args: {
        meetingId: nonNull(stringArg()),
    },
    resolve: async (_, { meetingId }, ctx) => {
        const openVotation = await ctx.prisma.votation.findFirst({
            where: {
                meetingId,
                status: { in: [VotationStatus.OPEN, VotationStatus.CHECKING_RESULT] },
            },
        });
        return openVotation?.id ?? '';
    },
});

export const GetMyReview = queryField('getMyReview', {
    type: 'MyReviewResult',
    description: '',
    args: {
        votationId: nonNull(stringArg()),
    },
    resolve: async (_, { votationId }, ctx) => {
        const participantId = await getParticipantId(votationId, ctx);
        const review = await ctx.prisma.votationResultReview.findUnique({
            where: {
                votationId_participantId: {
                    votationId,
                    participantId,
                },
            },
        });
        if (review) return { __typename: 'VotationReview', ...review };
        return { __typename: 'NoReview', message: 'There is no review for this user.' };
    },
});
