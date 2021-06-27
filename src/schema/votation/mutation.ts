import { inputObjectType, list, mutationField, nonNull, stringArg } from 'nexus';
import { Vote } from './';
import { Alternative, Votation } from './typedefs';
import { MajorityType } from '../enums';
import { pubsub } from '../../lib/pubsub';

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
    },
    resolve: async (_, { alternativeId }, ctx) => {
        const alternative = await ctx.prisma.alternative.findUnique({
            where: {
                id: alternativeId,
            },
            select: {
                votationId: true,
            },
        });
        if (!alternative) throw new Error();
        const [__, vote] = await ctx.prisma.$transaction([
            ctx.prisma.hasVoted.create({
                data: {
                    userId: ctx.userId,
                    votationId: alternative.votationId,
                },
            }),
            ctx.prisma.vote.create({
                data: {
                    alternativeId,
                },
            }),
        ]);
        const voteCount = await ctx.prisma.hasVoted.count({
            where: {
                votationId: alternative.votationId,
            },
        });
        await pubsub.publish('NEW_VOTE_REGISTERED', voteCount);
        return vote;
    },
});
