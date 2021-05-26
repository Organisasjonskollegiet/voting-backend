import { inputObjectType, mutationField, nonNull, stringArg } from 'nexus';
import { Vote } from './';
import { Alternative, Votation } from './typedefs';
import { MajorityType } from '../enums';

export const UpdateVotationInput = inputObjectType({
    name: 'UpdateVotationInput',
    definition(t) {
        t.nonNull.string('id');
        t.nonNull.string('title');
        t.nonNull.string('description');
        t.nonNull.boolean('blankVotes');
        t.nonNull.field('majorityType', { type: MajorityType });
        t.nonNull.int('majorityThreshold');
    },
});

export const CreateVotationInput = inputObjectType({
    name: 'CreateVotationInput',
    definition(t) {
        t.nonNull.string('title');
        t.nonNull.string('description');
        t.nonNull.boolean('blankVotes');
        t.nonNull.field('majorityType', { type: MajorityType });
        t.nonNull.int('majorityThreshold');
        t.nonNull.string('meetingId');
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

export const UpdateVotationMutation = mutationField('updateVotation', {
    type: Votation,
    description: '',
    args: {
        votation: nonNull(UpdateVotationInput),
    },
    resolve: async (_, { votation }, ctx) => {
        const updatedVotation = await ctx.prisma.votation.update({
            data: {
                ...votation,
            },
            where: {
                id: votation.id,
            },
        });
        return updatedVotation;
    },
});

export const DeleteVotationMutation = mutationField('deleteVotation', {
    type: Votation,
    description: '',
    args: {
        id: nonNull(stringArg()),
    },
    resolve: async (_, { id }, ctx) => {
        await ctx.prisma.alternative.deleteMany({ where: { votationId: id } });
        const deletedVotation = await ctx.prisma.votation.delete({
            where: {
                id,
            },
        });
        return deletedVotation;
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

export const UpdateAlternativeMutation = mutationField('updateAlternative', {
    type: Alternative,
    description: '',
    args: {
        id: nonNull(stringArg()),
        text: nonNull(stringArg()),
    },
    resolve: async (_, { id, text }, ctx) => {
        const updatedAlternative = await ctx.prisma.alternative.update({
            data: {
                text,
            },
            where: {
                id,
            },
        });
        return updatedAlternative;
    },
});

export const CastVoteMutation = mutationField('castVote', {
    type: Vote,
    args: {
        alternativeId: nonNull(stringArg()),
        votationId: nonNull(stringArg()),
    },
    // TODO: Refactor resolve function
    resolve: async (_, __, ___) => {
        //const hasVoted = await userHasVoted(ctx, votationId);
        //console.log(hasVoted);
        return null;
        // const participant = await ctx.prisma.participant.findFirst();
        // if (hasVoted) throw new Error('This user has already cast vote for this votation.');
        // const alternativeExists = checkAlternativeExists(ctx, alternativeId);
        // if (!alternativeExists) throw new Error('Alternative does not exist.');
        // await ctx.prisma.hasVoted.create({
        //     data: {
        //         votationId,
        //     },
        // });
        // const vote = await ctx.prisma.vote.create({ data: { alternativeId } });
        // return vote;
    },
});
