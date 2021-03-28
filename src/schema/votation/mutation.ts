import { mutationField, nonNull, stringArg } from 'nexus';
import { Vote } from './typedefs';
import { userHasVoted, checkAlternativeExists } from './utils';

export const CastVoteMutation = mutationField('castVote', {
    type: Vote,
    args: {
        alternativeId: nonNull(stringArg()),
        votationId: nonNull(stringArg()),
    },
    resolve: async (_, { alternativeId, votationId }, ctx) => {
        const hasVoted = await userHasVoted(ctx, votationId);
        if (hasVoted) throw new Error('This user has already cast vote for this votation.');
        const alternativeExists = checkAlternativeExists(ctx, alternativeId);
        if (!alternativeExists) throw new Error('Alternative does not exist.');
        await ctx.prisma.hasVoted.create({
            data: {
                userId: ctx.userId,
                votationId,
            },
        });
        const vote = await ctx.prisma.vote.create({ data: { alternativeId } });
        return vote;
    },
});
