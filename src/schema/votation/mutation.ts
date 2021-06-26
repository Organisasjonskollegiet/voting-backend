import { inputObjectType, intArg, list, mutationField, nonNull, stringArg } from 'nexus';
import { Vote } from './';
import { Alternative, Votation } from './typedefs';
import { MajorityType } from '../enums';

export const AlternativeInput = inputObjectType({
    name: 'AlternativeInput',
    definition(t) {
        t.nonNull.string('id');
        t.nonNull.string('text');
    },
});

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
        t.list.nonNull.field('alternatives', { type: AlternativeInput });
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

export const CreateVotationsMutation = mutationField('createVotations', {
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

export const UpdateVotationsMutation = mutationField('updateVotations', {
    type: list(Votation),
    description: '',
    args: {
        votations: nonNull(list(nonNull(UpdateVotationInput))),
    },
    resolve: async (_, { votations }, ctx) => {
        const promises = [];
        const alternativePromises = [];
        for (const votation of votations) {
            if (votation.alternatives) {
                for (const alternative of votation.alternatives) {
                    alternativePromises.push(
                        ctx.prisma.alternative.upsert({
                            where: {
                                id: alternative.id,
                            },
                            create: {
                                text: alternative.text,
                                votationId: votation.id,
                            },
                            update: {
                                text: alternative.text,
                            },
                        })
                    );
                }
            }
            promises.push(
                ctx.prisma.votation.update({
                    where: {
                        id: votation.id,
                    },
                    data: {
                        title: votation.title,
                        description: votation.title,
                        index: votation.index,
                        blankVotes: votation.blankVotes,
                        hiddenVotes: votation.hiddenVotes,
                        severalVotes: votation.severalVotes,
                        majorityType: votation.majorityType,
                        majorityThreshold: votation.majorityThreshold,
                    },
                })
            );
        }
        await Promise.all(alternativePromises);
        const resolved = await Promise.all(promises);
        return resolved;
    },
});

export const DeleteVotationsMutation = mutationField('deleteVotations', {
    type: list('String'),
    description: '',
    args: {
        ids: nonNull(list(nonNull(stringArg()))),
    },
    resolve: async (_, { ids }, ctx) => {
        const promises = [];
        for (const id of ids) {
            promises.push(
                new Promise(async (resolve) => {
                    await ctx.prisma.alternative.deleteMany({ where: { votationId: id } });
                    const votation = await ctx.prisma.votation.delete({
                        where: {
                            id,
                        },
                    });
                    resolve(votation.id);
                })
            );
        }
        const resolved = (await Promise.all(promises)) as string[];
        return resolved;
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
