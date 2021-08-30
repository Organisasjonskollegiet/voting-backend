import { Alternative, Votation, Vote } from '@prisma/client';
import { Context } from '../../context';

type VotationResult = {
    id: string;
    count: number;
};

interface AlternativeIdToVoteCount {
    [id: string]: number;
}

type VoteWithWeight = Vote & {
    weight: number;
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

const computeSimpleResult = async (ctx: Context, alternatives: Alternative[]) => {
    let tempWinners: VotationResult[] = [];
    for (const alternative of alternatives) {
        const voteCount = await ctx.prisma.vote.count({
            where: {
                alternativeId: alternative.id,
            },
        });
        if (voteCount > 0 && (tempWinners.length === 0 || voteCount > tempWinners[0].count)) {
            tempWinners = [{ id: alternative.id, count: voteCount }];
        } else if (voteCount > 0 && voteCount === tempWinners[0].count) {
            tempWinners.push({ id: alternative.id, count: voteCount });
        }
    }
    return tempWinners;
};

const computeQualifiedResult = async (ctx: Context, votation: Votation, alternatives: Alternative[]) => {
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
        if (voteCount > (votingEligibleParticipants * votation.majorityThreshold) / 100) {
            return [{ id: alternative.id, count: voteCount }];
        }
    }
    return [];
};

const computeStvResult = async (ctx: Context, votation: Votation, alternatives: Alternative[]) => {
    const winners: VotationResult[] = [];
    const losers: string[] = [];
    let alternativeIdToVoteCount: AlternativeIdToVoteCount = {};
    alternatives.forEach((alternative) => (alternativeIdToVoteCount[alternative.id] = 0));
    const hasVoted = await ctx.prisma.hasVoted.count({
        where: {
            votationId: votation.id,
        },
    });
    const quota = Math.floor(hasVoted / (votation.numberOfWinners + 1)) + 1;
    const votes = await ctx.prisma.vote.findMany({
        where: {
            alternative: {
                votationId: votation.id,
            },
        },
    });
    let votesWithWeight = votes.map((vote) => {
        return {
            ...vote,
            weight: 1,
        };
    });
    const alternativeIds = Object.keys(alternativeIdToVoteCount);
    while (true) {
        votesWithWeight.forEach((vote) => (alternativeIdToVoteCount[vote.alternativeId] += 1));
        const roundWinners = alternativeIds
            .filter((key) => alternativeIdToVoteCount[key] >= quota)
            .map((key) => {
                return {
                    id: key,
                    count: alternativeIdToVoteCount[key],
                };
            });
        if (roundWinners.length > 0) {
            winners.push(...roundWinners);
            roundWinners.forEach((winner) => {
                const surplus = winner.count - quota;
                const weightOfNextVotes = surplus / winner.count;
                for (let i = 0; i < votesWithWeight.length; i++) {
                    if (votesWithWeight[i].alternativeId === winner.id) {
                        const nextVoteId = votesWithWeight[i].nextVoteId;
                    }
                }
            });
            // Push whats over quota
        } else {
            let loser: VotationResult;
            alternativeIds.forEach((id) => {
                const count = alternativeIdToVoteCount[id];
                if (!loser || count < loser.count) {
                    loser = { id, count };
                }
            });
        }
    }
};

const computeResult = async (ctx: Context, votationId: string) => {
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
    switch (votation?.type) {
        case 'SIMPLE':
            return await computeSimpleResult(ctx, alternatives);
        case 'QUALIFIED':
            return await computeQualifiedResult(ctx, votation, alternatives);
        default:
            return [];
    }
};

export const setWinner = async (ctx: Context, votationId: string) => {
    const winners = await computeResult(ctx, votationId);
    if (winners.length === 1) {
        await ctx.prisma.alternative.update({
            where: {
                id: winners[0].id,
            },
            data: {
                isWinner: true,
            },
        });
    }
};
