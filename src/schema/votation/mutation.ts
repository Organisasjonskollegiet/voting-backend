import { inputObjectType, intArg, list, mutationField, nonNull, stringArg } from 'nexus';
import { Vote } from './';
import { Alternative, Votation } from './typedefs';
import { MajorityType, Status } from '../enums';

export const UpdateVotationInput = inputObjectType({
    name: 'UpdateVotationInput',
    definition(t) {
        t.nonNull.string('id');
        t.nonNull.string('title');
        t.nonNull.string('description');
        t.nonNull.boolean('blankVotes');
        t.nonNull.boolean('hiddenVotes');
        t.nonNull.boolean('severalVotes');
        t.nonNull.field('majorityType', { type: MajorityType });
        t.nonNull.int('majorityThreshold');
        t.nonNull.int('index');
    },
});

export const UpdateVotationStatusInput = inputObjectType({
    name: 'UpdateVotationStatusInput',
    definition(t) {
        t.nonNull.string('id');;
        t.nonNull.field('status', { type: Status })
    },
});

export const CreateVotationInput = inputObjectType({
    name: 'CreateVotationInput',
    definition(t) {
        t.nonNull.string('title');
        t.nonNull.string('description');
        t.nonNull.boolean('blankVotes');
        t.nonNull.boolean('hiddenVotes');
        t.nonNull.boolean('severalVotes');
        t.nonNull.field('majorityType', { type: MajorityType });
        t.nonNull.int('majorityThreshold');
        t.nonNull.int('index');
        t.list.nonNull.string('alternatives');
    },
});

export const CreateVotationsMutatioon = mutationField('createVotations', {
    type: list(Votation),
    args: {
        meetingId: nonNull(stringArg()),
        votations: nonNull(list(nonNull(CreateVotationInput))),
    },
    resolve: async (_, { votations, meetingId }, ctx) => {
        const promises = [];
        for (const votation of votations) {
            promises.push(
                ctx.prisma.votation.create({
                    data: {
                        ...votation,
                        meetingId,
                        alternatives: {
                            createMany: {
                                data: votation.alternatives
                                    ? votation.alternatives
                                          .filter((text) => text.trim().length > 0)
                                          .map((alternative) => {
                                              return {
                                                  text: alternative,
                                              };
                                          })
                                    : [],
                            },
                        },
                    },
                })
            );
        }
        const resolved = await Promise.all(promises);
        return resolved;
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

export const UpdateVotationStatusMutation = mutationField('updateVotationStatus', {
    type: Votation,
    description: '',
    args: {
        votation: nonNull(UpdateVotationStatusInput),
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

export const DeleteAlternativeMutation = mutationField('deleteAlternative', {
    type: Alternative,
    description: '',
    args: {
        id: nonNull(stringArg()),
    },
    resolve: async (_, { id }, ctx) => {
        const deletedAlternative = await ctx.prisma.alternative.delete({
            where: {
                id,
            },
        });
        return deletedAlternative;
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
