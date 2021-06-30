import { subscriptionField, nonNull, stringArg } from 'nexus';
import { pubsub } from '../../lib/pubsub';
import { NexusGenObjects } from '../../__generated__/nexus-typegen';

// type NewVoteRegisteredPayload = NexusGenObjects['NewVoteRegisteredPayload'];

export const NewVoteRegistered = subscriptionField('newVoteRegistered', {
    type: 'Int',
    args: {
        votationId: nonNull(stringArg()),
    },
    subscribe: async (_, { votationId }, ___) => {
        return pubsub.asyncIterator([`NEW_VOTE_REGISTERED_FOR_${votationId}`]);
    },
    resolve: async (voteCount: number, __, ___) => {
        return voteCount;
    },
});
