import { nonNull, stringArg, subscriptionField, objectType } from 'nexus';
import { pubsub } from '../../lib/pubsub';
import { NexusGenEnums } from '../../__generated__/nexus-typegen';

type VotationStatus = NexusGenEnums['VotationStatus'];

export const VotationStatusUpdatedResponse = objectType({
    name: 'VotationStatusUpdatedResponse',
    definition: (t) => {
        t.nonNull.string('votationId');
        t.nonNull.field('votationStatus', { type: 'VotationStatus' });
    },
});

export const NewVoteRegisteredResponse = objectType({
    name: 'NewVoteRegisteredResponse',
    definition: (t) => {
        t.nonNull.string('votationId');
        t.nonNull.int('voteCount');
    },
});

export const NewVoteRegistered = subscriptionField('newVoteRegistered', {
    type: 'NewVoteRegisteredResponse',
    args: {
        votationId: nonNull(stringArg()),
    },
    subscribe: async (_, { votationId }, ___) => {
        return pubsub.asyncIterator([`NEW_VOTE_REGISTERED_FOR_${votationId}`]);
    },
    resolve: async (voteCount: { votationId: string; voteCount: number }, __, ___) => {
        return voteCount;
    },
});

export const VotationStatusUpdated = subscriptionField('votationStatusUpdated', {
    type: 'VotationStatusUpdatedResponse',
    args: {
        id: nonNull(stringArg()),
    },
    subscribe: async (_, { id }, ctx) => {
        return pubsub.asyncIterator([`VOTATION_STATUS_UPDATED_FOR_${id}`]);
    },
    resolve: async (status: { votationId: string; votationStatus: VotationStatus }, __, ___) => {
        return status;
    },
});

export const ReviewAdded = subscriptionField('reviewAdded', {
    type: 'ReviewResult',
    args: {
        votationId: nonNull(stringArg()),
    },
    subscribe: async (_, { votationId }, ctx) => {
        return pubsub.asyncIterator([`REVIEW_ADDED_FOR_${votationId}`]);
    },
    resolve: async (votationId: string, __, ctx) => {
        const reviews = await ctx.prisma.votationResultReview.findMany({
            where: {
                votationId,
            },
        });
        return {
            approved: reviews.filter((review) => review.approved).length,
            disapproved: reviews.filter((review) => !review.approved).length,
        };
    },
});
