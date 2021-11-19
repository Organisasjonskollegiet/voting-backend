import { idArg, list, nonNull, queryField, stringArg } from 'nexus';
import { Alternative, StvResult, Votation, VotationResults, Result } from './typedefs';
import { VotationStatus } from '@prisma/client';
import { getParticipantId } from './utils';
import { getVoteCount } from '.';

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
        return await getVoteCount(votationId, ctx);
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
        const voteCount = await getVoteCount(votationId, ctx);
        const stvResult = await ctx.prisma.stvResult.findUnique({
            where: {
                votationId,
            },
        });
        if (!stvResult || !voteCount) return null;
        return { ...stvResult, ...voteCount };
    },
});

export const GetResult = queryField('result', {
    type: Result,
    description: 'Returns result of a votation',
    args: {
        votationId: nonNull(stringArg()),
    },
    resolve: async (_, { votationId }, ctx) => {
        return await ctx.prisma.votationResult.findUnique({
            where: {
                votationId,
            },
        });
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
        if (!votation) throw new Error('Votation does not exist.');
        const voteCount = await getVoteCount(votationId, ctx);
        return { ...votation, voteCount: voteCount.voteCount, votingEligibleCount: voteCount.votingEligibleCount };
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

export const GetReviews = queryField('getReviews', {
    type: 'ReviewResult',
    description: 'Return the number of approvals and disapprovals of a votation',
    args: {
        votationId: nonNull(stringArg()),
    },
    resolve: async (_, { votationId }, ctx) => {
        const reviews = await ctx.prisma.votationResultReview.findMany({
            where: {
                votationId,
            },
        });
        return {
            approved: reviews.filter((r) => r.approved).length,
            disapproved: reviews.filter((r) => !r.approved).length,
        };
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
