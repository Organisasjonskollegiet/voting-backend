import { objectType } from 'nexus';
import { Alternative as AlternativeModel, Vote as VoteModel, Votation as VotationModel } from '@prisma/client';
import { MajorityType, VotationStatus } from '../../enums';

export const Vote = objectType({
    name: 'Vote',
    definition: (t) => {
        t.nonNull.id('id');
        t.nonNull.string('alternativeId');
        t.string('nextVoteId');
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
        t.field('nextVote', {
            type: Vote,
            resolve: async (source, __, ctx) => {
                const { nextVoteId } = source as VoteModel;
                if (!nextVoteId) return null;
                const nextVote = ctx.prisma.vote.findUnique({ where: { id: nextVoteId } });
                return nextVote;
            },
        });
        t.field('prevVote', {
            type: Vote,
            resolve: async (source, __, ctx) => {
                const { id } = source as VoteModel;
                const prevVote = ctx.prisma.vote.findFirst({ where: { nextVoteId: id } });
                return prevVote;
            },
        });
    },
});

export const Votation = objectType({
    name: 'Votation',
    definition: (t) => {
        t.nonNull.id('id');
        t.nonNull.string('title');
        t.nonNull.string('description');
        t.int('order');
        t.nonNull.field('status', { type: VotationStatus });
        t.nonNull.boolean('blankVotes');
        t.nonNull.boolean('hiddenVotes');
        t.nonNull.boolean('severalVotes');
        t.nonNull.field('majorityType', { type: MajorityType });
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
        t.field('votes', {
            type: 'Int',
            resolve: async (source, __, ctx) => {
                const { id } = source as AlternativeModel;
                const votes = await ctx.prisma.vote.count({ where: { alternativeId: id } });
                return votes;
            },
        });
    },
});

export const NewVoteRegisteredPayload = objectType({
    name: 'NewVoteRegisteredPayload',
    description: 'The payload of newVoteRegistered subscription',
    definition(t) {
        t.nonNull.int('voteCount');
        t.nonNull.int('votingEligibleCount');
    },
});

export * from './results';
