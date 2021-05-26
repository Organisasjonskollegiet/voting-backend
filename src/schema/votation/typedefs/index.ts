import { objectType } from 'nexus';
import { Alternative as AlternativeModel, Vote as VoteModel, Votation as VotationModel } from '@prisma/client';
import { MajorityType, Status } from '../../enums';
import { User } from '../../auth';

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
        t.nonNull.field('status', { type: Status });
        t.boolean('blankVotes');
        t.nonNull.field('majorityType', { type: MajorityType });
        t.nonNull.int('majorityThreshold');
        t.nonNull.string('meetingId');
        t.list.field('hasVoted', { type: User });
        t.list.field('alternatives', {
            type: Alternative,
            resolve: async (source, __, ctx) => {
                const { id } = source as VotationModel;
                const alternatives = ctx.prisma.alternative.findMany({ where: { votationId: id } });
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
