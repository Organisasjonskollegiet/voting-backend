import { Context } from '../../context';

export const canUserVoteOnVotation = async (votationId: string, ctx: Context) => {
    // Both participant and votation needs to exist
    const votation = await ctx.prisma.votation.findUnique({ where: { id: votationId } });
    if (!votation) return false;
    const participant = await ctx.prisma.participant.findUnique({
        where: {
            userId_meetingId: {
                userId: ctx.userId,
                meetingId: votation.meetingId,
            },
        },
    });
    const hasVotedCount = await ctx.prisma.hasVoted.count({ where: { userId: ctx.userId, votationId } });
    return !!participant && votation.status === 'OPEN' && hasVotedCount == 0 && participant.isVotingEligible;
};
