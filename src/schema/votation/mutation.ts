import { inputObjectType, list, mutationField, nonNull, stringArg } from 'nexus';
import { Vote } from './';
import { pubsub } from '../../lib/pubsub';
import { Alternative, UpdateVotationStatusResult, Votation, MaxOneOpenVotationError } from './typedefs';
import { VotationType, VotationStatus } from '../enums';
import { setWinner } from './utils';

export const AlternativeInput = inputObjectType({
    name: 'AlternativeInput',
    definition(t) {
        t.nonNull.string('id');
        t.nonNull.string('text');
    },
});

export const StvVoteAlternativeInput = inputObjectType({
    name: 'StvVoteAlternativeInput',
    definition(t) {
        t.nonNull.string('alternativeId');
        t.nonNull.int('ranking');
    },
});

export const UpdateVotationInput = inputObjectType({
    name: 'UpdateVotationInput',
    definition(t) {
        t.nonNull.string('id');
        t.nonNull.string('title');
        t.string('description');
        t.nonNull.boolean('blankVotes');
        t.nonNull.boolean('hiddenVotes');
        t.nonNull.field('type', { type: VotationType });
        t.nonNull.int('numberOfWinners');
        t.nonNull.int('majorityThreshold');
        t.nonNull.int('index');
        t.list.nonNull.field('alternatives', { type: AlternativeInput });
    },
});

export const CreateVotationInput = inputObjectType({
    name: 'CreateVotationInput',
    definition(t) {
        t.nonNull.string('title');
        t.string('description');
        t.nonNull.boolean('blankVotes');
        t.nonNull.boolean('hiddenVotes');
        t.nonNull.field('type', { type: VotationType });
        t.nonNull.int('numberOfWinners');
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
                        description: votation.description,
                        index: votation.index,
                        blankVotes: votation.blankVotes,
                        hiddenVotes: votation.hiddenVotes,
                        type: votation.type,
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

export const UpdateVotationStatusMutation = mutationField('updateVotationStatus', {
    type: UpdateVotationStatusResult,
    description: '',
    args: {
        votationId: nonNull(stringArg()),
        status: nonNull(VotationStatus),
    },
    resolve: async (_, { votationId, status }, ctx) => {
        const votation = await ctx.prisma.votation.findUnique({
            where: {
                id: votationId,
            },
        });
        if (status === 'OPEN') {
            const openVotationsForMeeting = await ctx.prisma.votation.count({
                where: {
                    meetingId: votation?.meetingId,
                    status: 'OPEN',
                },
            });
            if (openVotationsForMeeting > 0 && votation?.status !== 'OPEN') {
                return {
                    __typename: 'MaxOneOpenVotationError',
                    message: 'Møtet kan kun ha en åpen votering om gangen',
                };
            }
            await pubsub.publish(`VOTATION_OPENED_FOR_MEETING_${votation?.meetingId}`, votationId);
        } else if (status === 'CHECKING_RESULT') {
            await setWinner(ctx, votationId);
        }
        const updatedVotation = await ctx.prisma.votation.update({
            data: {
                status,
            },
            where: {
                id: votationId,
            },
        });
        await pubsub.publish(`VOTATION_STATUS_UPDATED_FOR_${votationId}`, { votationId, votationStatus: status });
        return { __typename: 'Votation', ...updatedVotation };
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
                    await ctx.prisma.hasVoted.deleteMany({ where: { votationId: id } });
                    await ctx.prisma.vote.deleteMany({ where: { alternative: { votationId: id } } });
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

export const DeleteAlternativesMutation = mutationField('deleteAlternatives', {
    type: list('String'),
    description: '',
    args: {
        ids: nonNull(list(nonNull(stringArg()))),
    },
    resolve: async (_, { ids }, ctx) => {
        const promises: Promise<string>[] = [];
        for (const id of ids) {
            promises.push(
                new Promise(async (resolve) => {
                    await ctx.prisma.alternative.delete({
                        where: {
                            id,
                        },
                    });
                    resolve(id);
                })
            );
        }
        const alternatives = await Promise.all(promises);
        return alternatives;
    },
});

export const CastStvVoteMutation = mutationField('castStvVote', {
    type: 'String',
    args: {
        votationId: nonNull(stringArg()),
        alternatives: nonNull(list(nonNull(StvVoteAlternativeInput))),
    },
    resolve: async (_, { votationId, alternatives }, ctx) => {
        const stvVote = await ctx.prisma.stvVote.create({
            data: {
                votationId,
            },
        });
        const [__, vote] = await ctx.prisma.$transaction([
            ctx.prisma.hasVoted.create({
                data: {
                    userId: ctx.userId,
                    votationId,
                },
            }),
            ...alternatives.map((a) =>
                ctx.prisma.vote.create({
                    data: {
                        alternativeId: a.alternativeId,
                        stvVoteId: stvVote.id,
                        ranking: a.ranking,
                    },
                })
            ),
        ]);
        return 'Vote registered';
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
        await pubsub.publish(`NEW_VOTE_REGISTERED_FOR_${alternative.votationId}`, {
            votationId: alternative.votationId,
            voteCount,
        });
        return vote;
    },
});

export const CastBlankVoteMutation = mutationField('castBlankVote', {
    type: 'String',
    args: {
        votationId: nonNull(stringArg()),
    },
    description: 'Returns the id of the votation',
    resolve: async (_, { votationId }, ctx) => {
        const [__, votation] = await ctx.prisma.$transaction([
            ctx.prisma.hasVoted.create({ data: { userId: ctx.userId, votationId: votationId } }),
            ctx.prisma.votation.update({ where: { id: votationId }, data: { blankVoteCount: { increment: 1 } } }),
        ]);
        const voteCount = await ctx.prisma.hasVoted.count({ where: { votationId: votationId } });
        await pubsub.publish(`NEW_VOTE_REGISTERED_FOR_${votationId}`, { votationId, voteCount });
        return votation.id;
    },
});
