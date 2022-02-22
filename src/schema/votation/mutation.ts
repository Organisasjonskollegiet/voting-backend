import { booleanArg, inputObjectType, list, mutationField, nonNull, stringArg } from 'nexus';
import { Vote } from './';
import { pubsub } from '../../lib/pubsub';
import { VotationStatus as VotationStatusDb } from '.prisma/client';
import { Alternative, Votation, MaxOneOpenVotationError, OpenVotationResult } from './typedefs';
import { VotationType, VotationStatus } from '../enums';
import { checkIfValidStatusUpdate, getVoteCount, setWinner } from './utils';
import { VotationStatusUpdatedResponse } from './subscriptions';
import { boolean } from 'casual';
import { getParticipantId } from './utils';

export const UpdateAlternativeInput = inputObjectType({
    name: 'UpdateAlternativeInput',
    definition(t) {
        t.nonNull.string('id');
        t.nonNull.string('text');
        t.nonNull.int('index');
    },
});

export const CreateAlternativeInput = inputObjectType({
    name: 'CreateAlternativeInput',
    definition(t) {
        t.nonNull.string('text');
        t.nonNull.int('index');
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
        t.list.nonNull.field('alternatives', { type: UpdateAlternativeInput });
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
        t.list.nonNull.field('alternatives', { type: CreateAlternativeInput });
    },
});

export const UpdateVotationIndexInput = inputObjectType({
    name: 'UpdateVotationIndexInput',
    definition(t) {
        t.nonNull.string('id');
        t.nonNull.int('index');
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
            const alternatives = votation.alternatives
                ? votation.alternatives.filter((alternative) => alternative.text.trim().length > 0)
                : [];
            promises.push(
                ctx.prisma.votation.create({
                    data: {
                        ...votation,
                        meetingId,
                        alternatives: {
                            createMany: {
                                data: alternatives,
                            },
                        },
                    },
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        status: true,
                        blankVotes: true,
                        hiddenVotes: true,
                        type: true,
                        majorityThreshold: true,
                        numberOfWinners: true,
                        index: true,
                        alternatives: true,
                        meetingId: true,
                    },
                })
            );
        }
        const resolved = await Promise.all(promises);
        await pubsub.publish(`VOTATIONS_UPDATED_FOR_${meetingId}`, resolved);
        return resolved;
    },
});

export const UpdateVotationIndexes = mutationField('updateVotationIndexes', {
    type: list(Votation),
    args: {
        meetingId: nonNull(stringArg()),
        votations: nonNull(list(nonNull(UpdateVotationIndexInput))),
    },
    resolve: async (_, { votations, meetingId }, ctx) => {
        const resolved = await Promise.all(
            votations.map((v) =>
                ctx.prisma.votation.update({
                    where: {
                        id: v.id,
                    },
                    data: {
                        index: v.index,
                    },
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        status: true,
                        blankVotes: true,
                        hiddenVotes: true,
                        type: true,
                        majorityThreshold: true,
                        numberOfWinners: true,
                        index: true,
                        alternatives: true,
                        meetingId: true,
                    },
                })
            )
        );
        await pubsub.publish(`VOTATIONS_UPDATED_FOR_${meetingId}`, resolved);
        return resolved;
    },
});

export const UpdateVotationsMutation = mutationField('updateVotations', {
    type: list(Votation),
    description: 'Update votations belonging to a meeting.',
    args: {
        meetingId: nonNull(stringArg()),
        votations: nonNull(list(nonNull(UpdateVotationInput))),
    },
    resolve: async (_, { votations, meetingId }, ctx) => {
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
                                index: alternative.index,
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
                        blankVotes: votation.blankVotes,
                        hiddenVotes: votation.hiddenVotes,
                        type: votation.type,
                        index: votation.index,
                        majorityThreshold: votation.majorityThreshold,
                        numberOfWinners: votation.numberOfWinners,
                    },
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        status: true,
                        blankVotes: true,
                        hiddenVotes: true,
                        type: true,
                        majorityThreshold: true,
                        numberOfWinners: true,
                        index: true,
                        alternatives: true,
                        meetingId: true,
                    },
                })
            );
        }
        await Promise.all(alternativePromises);
        const resolved = await Promise.all(promises);
        await pubsub.publish(`VOTATIONS_UPDATED_FOR_${meetingId}`, resolved);
        return resolved;
    },
});

export const StartNextVotation = mutationField('startNextVotation', {
    type: OpenVotationResult,
    description: 'Start the next votation in line for a meeting.',
    args: {
        meetingId: nonNull(stringArg()),
    },
    resolve: async (_, { meetingId }, ctx) => {
        const openVotation = await ctx.prisma.votation.count({
            where: {
                meetingId,
                status: VotationStatusDb.OPEN,
            },
        });
        if (openVotation !== 0)
            return {
                __typename: 'MaxOneOpenVotationError',
                message: 'Møtet kan kun ha en åpen votering om gangen',
            };
        const votation = await ctx.prisma.votation.findFirst({
            where: {
                meetingId,
                status: VotationStatusDb.UPCOMING,
            },
            orderBy: {
                index: 'asc',
            },
            select: {
                id: true,
                title: true,
                alternatives: true,
            },
        });
        if (!votation)
            return {
                __typename: 'NoUpcomingVotations',
                message: 'Møtet har ingen kommende voteringer.',
            };
        if (votation.alternatives.length === 0)
            return {
                __typename: 'VotationHasNoAlternatives',
                message: 'Voteringen kan kan ikke åpnes da den ikke har noen alternativer.',
            };
        await ctx.prisma.votation.update({
            where: {
                id: votation.id,
            },
            data: {
                status: VotationStatusDb.OPEN,
            },
        });
        await pubsub.publish(`VOTATION_OPENED_FOR_MEETING_${meetingId}`, votation.id);
        return { __typename: 'OpenedVotation', votationId: votation.id, title: votation.title };
    },
});

export const UpdateVotationStatusMutation = mutationField('updateVotationStatus', {
    type: Votation,
    description: 'Update status of a votation, to anything other than OPEN.',
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
        if (!votation) throw new Error('Votation doess not exist.');
        checkIfValidStatusUpdate(votation.status, status);
        if (status === 'CHECKING_RESULT') {
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
        await pubsub.publish(`VOTATION_STATUS_UPDATED_FOR_${votationId}`, {
            votationId,
            votationStatus: status,
            reason: status === VotationStatusDb.INVALID ? 'Voteringen ble avbrutt av en administrator.' : '',
        });
        return { __typename: 'Votation', ...updatedVotation };
    },
});

export const DeleteVotationMutation = mutationField('deleteVotation', {
    type: 'String',
    description: '',
    args: {
        votationId: nonNull(stringArg()),
    },
    resolve: async (_, { votationId }, ctx) => {
        const votation = await ctx.prisma.votation.delete({
            where: {
                id: votationId,
            },
        });
        await pubsub.publish(`VOTATION_DELETED_${votation.meetingId}`, votationId);
        return votationId;
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
        const subscriptionResponse = await getVoteCount(votationId, ctx);
        await pubsub.publish(`NEW_VOTE_REGISTERED_FOR_${votationId}`, subscriptionResponse);
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
        const subscriptionResponse = await getVoteCount(alternative.votationId, ctx);
        await pubsub.publish(`NEW_VOTE_REGISTERED_FOR_${alternative.votationId}`, subscriptionResponse);
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
        const subscriptionResponse = await getVoteCount(votationId, ctx);
        await pubsub.publish(`NEW_VOTE_REGISTERED_FOR_${votationId}`, subscriptionResponse);
        return votation.id;
    },
});

export const ReviewVotation = mutationField('reviewVotation', {
    type: 'String',
    args: {
        votationId: nonNull(stringArg()),
        approved: nonNull(booleanArg()),
    },
    description: 'Approve or disapprove a votation result',
    resolve: async (_, { votationId, approved }, ctx) => {
        const participantId = await getParticipantId(votationId, ctx);
        await ctx.prisma.votationResultReview.upsert({
            where: {
                votationId_participantId: { participantId, votationId },
            },
            create: {
                participantId: participantId,
                votationId: votationId,
                approved,
            },
            update: {
                approved,
            },
        });
        const reviews = await ctx.prisma.votationResultReview.findMany({
            where: {
                votationId,
            },
        });
        await pubsub.publish(`REVIEW_ADDED_FOR_${votationId}`, {
            approved: reviews.filter((r) => r.approved).length,
            disapproved: reviews.filter((r) => !r.approved).length,
        });
        return `Votering ${approved ? '' : 'ikke '}godkjent.`;
    },
});
