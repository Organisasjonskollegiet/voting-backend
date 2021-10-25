import { objectType } from 'nexus';
import {
    Alternative as AlternativeModel,
    Vote as VoteModel,
    Votation as VotationModel,
    StvRoundResult as StvRoundResultModel,
    AlternativeRoundVoteCount as AlternativeRoundVoteCountModel,
    StvResult as StvResultModel,
} from '@prisma/client';
import { VotationType, VotationStatus } from '../../enums';

export const Vote = objectType({
    name: 'Vote',
    definition: (t) => {
        t.nonNull.id('id');
        t.nonNull.string('alternativeId');
        t.field('alternative', {
            type: Alternative,
            resolve: async (source, __, ctx) => {
                const { alternativeId } = source as VoteModel;
                const alternative = ctx.prisma.alternative.findUnique({
                    where: { id: alternativeId },
                    rejectOnNotFound: true,
                });
                return alternative;
            },
        });
    },
});

export const Votation = objectType({
    name: 'Votation',
    definition: (t) => {
        t.nonNull.id('id');
        t.nonNull.string('title');
        t.string('description');
        t.int('order');
        t.nonNull.field('status', { type: VotationStatus });
        t.nonNull.boolean('blankVotes');
        t.nonNull.boolean('hiddenVotes');
        t.nonNull.field('type', { type: VotationType });
        t.nonNull.int('numberOfWinners');
        t.nonNull.int('majorityThreshold');
        t.nonNull.int('index');
        t.nonNull.string('meetingId');
        t.list.field('hasVoted', {
            type: 'String',
            resolve: async (source, __, ctx) => {
                const { id } = source as VotationModel;
                const hasVoted = await ctx.prisma.hasVoted.findMany({
                    where: {
                        votationId: id,
                    },
                    select: {
                        userId: true,
                    },
                });
                return hasVoted.map((hasVoted) => hasVoted.userId);
            },
        });
        t.list.field('alternatives', {
            type: Alternative,
            resolve: async (source, __, ctx) => {
                const { id } = source as VotationModel;
                const alternatives = await ctx.prisma.alternative.findMany({ where: { votationId: id } });
                return alternatives;
            },
        });
    },
});

export const Alternative = objectType({
    name: 'Alternative',
    definition: (t) => {
        t.nonNull.id('id');
        t.nonNull.string('text');
        t.nonNull.string('votationId');
    },
});

export const AlternativeResult = objectType({
    name: 'AlternativeResult',
    definition: (t) => {
        t.nonNull.id('id');
        t.nonNull.string('text');
        t.nonNull.string('votationId');
        // must only be visible to participants when votation status is published_result
        t.nonNull.boolean('isWinner');
        t.nonNull.field('votes', {
            type: 'Int',
            resolve: async (source, __, ctx) => {
                const { id } = source as AlternativeModel;
                const votes = await ctx.prisma.vote.count({ where: { alternativeId: id } });
                return votes;
            },
        });
    },
});

export const AlternativeWithWinner = objectType({
    name: 'AlternativeWithWinner',
    definition: (t) => {
        t.nonNull.id('id');
        t.nonNull.string('text');
        t.nonNull.boolean('isWinner');
    },
});

export const VotationWithWinner = objectType({
    name: 'VotationWithWinner',
    definition: (t) => {
        t.nonNull.id('id');
        t.nonNull.list.field('alternatives', {
            type: AlternativeWithWinner,
            resolve: async (source, __, ctx) => {
                const { id } = source as VotationModel;
                const alternatives = await ctx.prisma.alternative.findMany({ where: { votationId: id } });
                return alternatives;
            },
        });
    },
});

export const VoteCountResult = objectType({
    name: 'VoteCountResult',
    description: 'The result of getVoteCount',
    definition(t) {
        t.nonNull.int('voteCount');
        t.nonNull.int('votingEligibleCount');
    },
});

export const AlternativeRoundVoteCount = objectType({
    name: 'AlternativeRoundVoteCount',
    description: 'connects alternative to its vote count for one round when computing stv result',
    definition(t) {
        t.nonNull.field('alternative', {
            type: Alternative,
            resolve: async (source, __, ctx) => {
                const { alterantiveId } = source as AlternativeRoundVoteCountModel;
                const alternative = await ctx.prisma.alternative.findUnique({
                    where: {
                        id: alterantiveId,
                    },
                });
                if (!alternative) throw new Error('Alternative does not exist.');
                return alternative;
            },
        });
        t.nonNull.float('voteCount');
    },
});

export const StvRoundResults = objectType({
    name: 'StvRoundResult',
    description: 'Results from one round computing the result of an stv votation',
    definition(t) {
        t.nonNull.string('id');
        t.nonNull.int('index');
        t.nonNull.list.nonNull.field('winners', {
            type: Alternative,
            resolve: async (source, __, ctx) => {
                const { id } = source as StvRoundResultModel;
                const alternatives = await ctx.prisma.alternative.findMany({
                    where: {
                        winnerOfStvRoundId: id,
                    },
                });
                return alternatives;
            },
        });
        t.nonNull.list.nonNull.field('losers', {
            type: Alternative,
            resolve: async (source, __, ctx) => {
                const { id } = source as StvRoundResultModel;
                const alternatives = await ctx.prisma.alternative.findMany({
                    where: {
                        loserOfStvRoundId: id,
                    },
                });
                return alternatives;
            },
        });
        t.nonNull.list.nonNull.field('alternativesWithRoundVoteCount', {
            type: AlternativeRoundVoteCount,
            resolve: async (source, __, ctx) => {
                const { id } = source as StvRoundResultModel;
                const alternativesWithRoundVoteCount = await ctx.prisma.alternativeRoundVoteCount.findMany({
                    where: {
                        stvRoundResultId: id,
                    },
                });
                return alternativesWithRoundVoteCount;
            },
        });
    },
});

export const StvResult = objectType({
    name: 'StvResult',
    description: 'Results from a stv votation',
    definition(t) {
        t.nonNull.string('votationId');
        t.nonNull.int('quota');
        t.nonNull.list.nonNull.field('stvRoundResults', {
            type: StvRoundResults,
            resolve: async (source, __, ctx) => {
                const { votationId } = source as StvResultModel;
                const stvRoundResults = await ctx.prisma.stvRoundResult.findMany({
                    where: {
                        stvResultId: votationId,
                    },
                });
                return stvRoundResults;
            },
        });
        t.nonNull.int('voteCount');
        t.nonNull.int('votingEligibleCount');
    },
});

export const VotationResults = objectType({
    name: 'VotationResults',
    description: 'The results of a votation',
    definition(t) {
        t.nonNull.list.field('alternatives', {
            type: AlternativeResult,
            resolve: async (source, __, ctx) => {
                const { id } = source as VotationModel;
                const alternatives = await ctx.prisma.alternative.findMany({ where: { votationId: id } });
                return alternatives;
            },
        });
        t.nonNull.boolean('blankVotes');
        t.nonNull.int('blankVoteCount');
        t.nonNull.field('voteCount', {
            type: 'Int',
            resolve: async (source, __, ctx) => {
                const { id } = source as VotationModel;
                return await ctx.prisma.hasVoted.count({
                    where: {
                        votationId: id,
                    },
                });
            },
        });
        t.nonNull.field('votingEligibleCount', {
            type: 'Int',
            resolve: async (source, __, ctx) => {
                const { id } = source as VotationModel;
                const votation = await ctx.prisma.votation.findUnique({
                    where: {
                        id,
                    },
                });
                return await ctx.prisma.participant.count({
                    where: {
                        meetingId: votation?.meetingId,
                        isVotingEligible: true,
                    },
                });
            },
        });
    },
});

export const VotationReview = objectType({
    name: 'VotationReview',
    definition(t) {
        t.nonNull.boolean('approved');
    },
});

export * from './results';
