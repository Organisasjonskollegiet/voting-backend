import { nonNull, stringArg, subscriptionField } from 'nexus';
import { pubsub } from '../../lib/pubsub';
import { NexusGenEnums } from '../../__generated__/nexus-typegen';

type VotationStatus = NexusGenEnums['VotationStatus'];

export const NewVoteRegistered = subscriptionField('newVoteRegistered', {
    type: 'Int',
    args: {
        votationId: nonNull(stringArg()),
    },
    subscribe: async (_, { votationId }, ctx) => {
        return pubsub.asyncIterator([`NEW_VOTE_REGISTERED_FOR_${votationId}`]);
    },
    resolve: async (voteCount: number, __, ___) => {
        return voteCount;
    },
});

export const VotationStatusUpdated = subscriptionField('votationStatusUpdated', {
    type: 'VotationStatus',
    args: {
        id: nonNull(stringArg()),
    },
    subscribe: async (_, { id }, ctx) => {
        return pubsub.asyncIterator([`VOTATION_STATUS_UPDATED_FOR_${id}`]);
    },
    resolve: async (status: VotationStatus, __, ___) => {
        return status;
    },
});
