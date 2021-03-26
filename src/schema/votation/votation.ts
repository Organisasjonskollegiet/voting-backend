import { enumType, extendType, list, nonNull, objectType, stringArg } from 'nexus';
import { User } from '../auth/user';
import { Votation as VotationType, Vote as VoteType, Alternative as AlternativeType } from '@prisma/client';
import { Meeting } from '../meeting/meetings';
import { Context } from '../../context';

export const MajorityType = enumType({
    name: 'MajorityType',
    members: ['QUALIFIED', 'SIMPLE'],
});
export const Status = enumType({
    name: 'Status',
    members: ['UPCOMING', 'ONGOING', 'ENDED'],
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
                const alternative = ctx.prisma.alternative.findUnique({ where: { id: alternativeId } });
                if (!alternative) throw new Error('The vote has no alternative');
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
                const meeting = await ctx.prisma.meeting.findUnique({ where: { id: meetingId } });
                if (!meeting) throw new Error('No meeting with this id');
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

export const VotationQuery = extendType({
    type: 'Query',
    definition: (t) => {
        t.field('votations_by_meeting', {
            type: list(Votation),
            args: {
                meetingId: nonNull(stringArg()),
            },
            resolve: (_, { meetingId }, ctx) => {
                return ctx.prisma.votation.findMany({ where: { meetingId } });
            },
        });
        t.field('alternatives_by_votation', {
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
    },
});

const userHasVoted = async (ctx: Context, votationId: string) => {
    if (!ctx.userId) throw new Error('UserId must not be null');
    const hasVoted = await ctx.prisma.hasVoted.findFirst({ where: { votationId, userId: ctx.userId } });
    return hasVoted !== null;
};

const checkAlternativeExists = async (ctx: Context, alternativeId: string) => {
    const alternative = await ctx.prisma.alternative.findUnique({ where: { id: alternativeId } });
    return alternative !== null;
};

export const VotationMutation = extendType({
    type: 'Mutation',
    definition: (t) => {
        t.field('cast_vote', {
            type: Vote,
            args: {
                alternativeId: nonNull(stringArg()),
                votationId: nonNull(stringArg()),
            },
            resolve: async (_, { alternativeId, votationId }, ctx) => {
                if (!ctx.userId) throw new Error('UserId must not be null');
                if (!alternativeId) throw new Error('AlternativeId must be provided.');
                const hasVoted = await userHasVoted(ctx, votationId);
                if (hasVoted) throw new Error('This user has already cast vote for this votation.');
                const alternativeExists = checkAlternativeExists(ctx, alternativeId);
                if (!alternativeExists) throw new Error('Alternative does not exist.');
                await ctx.prisma.hasVoted.create({
                    data: {
                        userId: ctx.userId,
                        votationId,
                    },
                });
                const vote = await ctx.prisma.vote.create({ data: { alternativeId } });
                return vote;
            },
        });
    },
});
