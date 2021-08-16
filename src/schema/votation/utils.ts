import { Context } from '../../context';

type VotationResult = {
    id: string;
    count: number;
};

export const userHasVoted = async (ctx: Context, votationId: string) => {
    const hasVoted = await ctx.prisma.hasVoted.findUnique({
        where: { userId_votationId: { userId: ctx.userId, votationId: votationId } },
    });
    return hasVoted !== null;
};

export const checkAlternativeExists = async (ctx: Context, alternativeId: string) => {
    const alternative = await ctx.prisma.alternative.findUnique({ where: { id: alternativeId } });
    return alternative !== null;
};

export const computeResult = async (ctx: Context, votationId: string) => {
    const votation = await ctx.prisma.votation.findUnique({
        where: {
            id: votationId,
        },
    });
    const alternatives = await ctx.prisma.alternative.findMany({
        where: {
            votationId,
        },
    });
    switch (votation?.majorityType) {
        case 'SIMPLE':
            let tempWinners: VotationResult[] = [];
            for (const alternative of alternatives) {
                const voteCount = await ctx.prisma.vote.count({
                    where: {
                        alternativeId: alternative.id,
                    },
                });
                if (tempWinners.length === 0 || voteCount > tempWinners[0].count) {
                    tempWinners = [{ id: alternative.id, count: voteCount }];
                } else if (voteCount === tempWinners[0].count) {
                    tempWinners.push({ id: alternative.id, count: voteCount });
                }
            }
            return tempWinners;
        case 'QUALIFIED':
            const votingEligibleParticipants = await ctx.prisma.participant.count({
                where: {
                    meetingId: votation?.meetingId,
                    isVotingEligible: true,
                },
            });
            for (const alternative of alternatives) {
                const voteCount = await ctx.prisma.vote.count({
                    where: {
                        alternativeId: alternative.id,
                    },
                });
                if (voteCount > votingEligibleParticipants * votation.majorityThreshold) {
                    return [{ id: alternative.id, count: voteCount }];
                }
            }
            return [];
        default:
            return [];
    }
};
