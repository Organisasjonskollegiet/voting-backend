import { subscriptionField } from 'nexus';
import { pubsub } from '../../lib/pubsub';
import { NexusGenEnums } from '../../__generated__/nexus-typegen';

type VotationStatus = NexusGenEnums['VotationStatus'];

export const NewVoteRegistered = subscriptionField('newVoteRegistered', {
    type: 'Int',
    subscribe: () => pubsub.asyncIterator(['NEW_VOTE_REGISTERED']),
    resolve: async (voteCount: number, __, ___) => {
        return voteCount;
    },
});

export const VotationStatusUpdated = subscriptionField('votationStatusUpdated', {
    type: 'VotationStatus',
    subscribe: () => pubsub.asyncIterator(['VOTATION_STATUS_UPDATED']),
    resolve: async (status: VotationStatus, __, ___) => {
        return status;
    },
});
