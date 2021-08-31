import { idArg, list, nonNull, queryField, stringArg } from 'nexus';
import { Alternative, Votation, VotationResults } from './typedefs';
import { VotationStatus } from '@prisma/client';

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

export const AlternativesByVotation = queryField('alternativesByVotation', {
    type: list(Alternative),
    args: {
        votationId: nonNull(stringArg()),
    },
    resolve: async (_, { votationId }, ctx) => {
        const alternatives = await ctx.prisma.alternative.findMany({ where: { votationId } });
        if (!alternatives)
            throw new Error('There is no alternatives for this votation, or the votation does not exist.');
        return alternatives;
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

export const GetWinnerOfVotation = queryField('getWinnerOfVotation', {
    type: list(Alternative),
    description: '',
    args: {
        id: nonNull(stringArg()),
    },
    resolve: async (_, { id }, ctx) => {
        return await ctx.prisma.alternative.findMany({
            where: {
                votationId: id,
                isWinner: true,
            },
        });
    },
});

export const GetVotationResults = queryField('getVotationResults', {
    type: VotationResults,
    description: '',
    args: {
        id: nonNull(stringArg()),
    },
    resolve: async (_, { id }, ctx) => {
        const votation = await ctx.prisma.votation.findUnique({
            where: {
                id,
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
