import { objectType, list } from 'nexus';
import { Alternative as AlternativeType, Vote as VoteType, Votation as VotationType } from '@prisma/client';
import { MajorityType, Status } from '../enums';
import { Meeting } from '../meeting';
import { User } from '../auth';

export const Vote = objectType({
    name: 'Vote',
    definition: (t) => {
        t.nonNull.id('id');
        t.nonNull.string('alternativeId');
        t.string('nextVoteId');
        t.field('alternative', {
            type: Alternative,
            resolve: async (source, __, ctx) => {
                const { alternativeId } = source as VoteType;
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
                const { nextVoteId } = source as VoteType;
                if (!nextVoteId) return null;
                const nextVote = ctx.prisma.vote.findUnique({ where: { id: nextVoteId } });
                return nextVote;
            },
        });
        t.field('prevVote', {
            type: Vote,
            resolve: async (source, __, ctx) => {
                const { id } = source as VoteType;
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
        t.nonNull.field('meeting', {
            type: Meeting,
            resolve: async (source, __, ctx) => {
                const { meetingId } = source as VotationType;
                const meeting = await ctx.prisma.meeting.findUnique({
                    where: { id: meetingId },
                    rejectOnNotFound: true,
                });
                return meeting;
            },
        });
        t.list.field('hasVoted', { type: User });
        t.list.field('alternatives', {
            type: Alternative,
            resolve: async (source, __, ctx) => {
                const { id } = source as VotationType;
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
        t.field('votation', {
            type: Votation,
            resolve: async (source, __, ctx) => {
                const { votationId } = source as AlternativeType;
                const votation = ctx.prisma.votation.findUnique({ where: { id: votationId } });
                return votation;
            },
        });
        t.field('votes', {
            type: list(Vote),
            resolve: async (source, __, ctx) => {
                const { id } = source as AlternativeType;
                const votes = ctx.prisma.vote.findMany({ where: { alternativeId: id } });
                return votes;
            },
        });
    },
});
