import { subscriptionField } from 'nexus';
import { pubsub } from '../../lib/pubsub';
import { NexusGenObjects } from '../../__generated__/nexus-typegen';

// type NewVoteRegisteredPayload = NexusGenObjects['NewVoteRegisteredPayload'];

export const NewVoteRegistered = subscriptionField('newVoteRegistered', {
    type: 'Int',
    subscribe: () => pubsub.asyncIterator(['NEW_VOTE_REGISTERED']),
    resolve: async (voteCount: number, __, ___) => {
        return voteCount;
    },
});
