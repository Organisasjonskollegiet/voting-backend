import { inputObjectType, mutationField, nonNull, stringArg } from 'nexus';
import { Vote } from './';
import { Alternative, Votation } from './typedefs';
import { userHasVoted, checkAlternativeExists } from './utils';
import { MajorityType } from '../enums';

export const CreateVotationInput = inputObjectType({
    name: 'CreateVotationInput',
    definition(t) {
        t.nonNull.string('title');
        t.nonNull.string('description');
        t.nonNull.int('order');
        t.nonNull.boolean('blankVotes');
        t.nonNull.field('majorityType', { type: MajorityType });
        t.nonNull.int('majorityThreshold');
        t.nonNull.string('meetingId');
    },
});

export const CastVoteMutation = mutationField('castVote', {
    type: Vote,
    args: {
        alternativeId: nonNull(stringArg()),
        votationId: nonNull(stringArg()),
    },
    resolve: async (_, { alternativeId, votationId }, ctx) => {
        const hasVoted = await userHasVoted(ctx, votationId);
        if (hasVoted) throw new Error('This user has already cast vote for this votation.');
        const alternativeExists = checkAlternativeExists(ctx, alternativeId);
        if (!alternativeExists) throw new Error('Alternative does not exist.');
        await ctx.prisma.hasVoted.create({
            data: {
                userId: ctx.user.id,
                votationId,
            },
        });
        const vote = await ctx.prisma.vote.create({ data: { alternativeId } });
        return vote;
    },
});

export const CreateVotationMutation = mutationField('createVotation', {
    type: Votation,
    args: {
        votation: nonNull(CreateVotationInput),
    },
    resolve: async (_, { votation }, ctx) => {
        const createdVotation = await ctx.prisma.votation.create({
            data: votation,
        });
        return createdVotation;
    },
});

export const CreateAlternativeMutation = mutationField('createAlternative', {
    type: Alternative,
    args: {
        text: nonNull(stringArg()),
        votationId: nonNull(stringArg()),
    },
    resolve: async (_, args, ctx) => {
        const createdAlternative = await ctx.prisma.alternative.create({
            data: args,
        });
        return createdAlternative;
    },
});
