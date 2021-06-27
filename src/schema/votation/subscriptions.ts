import { subscriptionField } from 'nexus';
import { pubsub } from '../../lib/pubsub';

export const NewVoteRegistered = subscriptionField('newVoteRegistered', {
    type: 'Int',
    subscribe: () => pubsub.asyncIterator(['NEW_VOTE_REGISTERED']),
    resolve: async (votationId: string, __, ctx) => {
        const numberOfVotes = await ctx.prisma.hasVoted.count({
            where: {
                votationId,
            },
        });
        return numberOfVotes;
    },
});
