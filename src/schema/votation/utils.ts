import { Alternative, Votation, Vote } from '@prisma/client';
import { Context } from '../../context';

type VotationResult = {
    id: string;
    count: number;
};

interface AlternativeIdToVoteCount {
    [id: string]: {
        voteCount: number;
        votedBy: {
            stvId: string;
            weight: number;
        }[];
    };
}

type StvVoteWithWeightAndActiveRank = {
    id: string;
    votes: Vote[];
    weight: number;
    activeRank: number;
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
    return tempWinners.map((winner) => winner.id);
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
            return [alternative.id];
        }
    }
    return [];
};

const redistributeVotes = (
    eliminatedAlternatives: string[],
    alternativeIdToVoteCount: AlternativeIdToVoteCount,
    quota: number,
    stvVotesWithWeightAndActiveRank: StvVoteWithWeightAndActiveRank[],
    winners: string[],
    losers: string[]
) => {
    let unchangedStvVotesWithWeightAndActiveRank = [...stvVotesWithWeightAndActiveRank];
    const updatedStvVotesWithWeightAndActiveRank: StvVoteWithWeightAndActiveRank[] = [];
    eliminatedAlternatives.forEach((eliminatedAlternative) => {
        const winnerObject = alternativeIdToVoteCount[eliminatedAlternative];
        const surplus = winnerObject.voteCount - quota;
        const weightOfNextVotes = surplus >= 0 ? surplus / winnerObject.voteCount : 1;
        winnerObject.votedBy.forEach((votedBy) => {
            const indexOfStv = unchangedStvVotesWithWeightAndActiveRank.map((stv) => stv.id).indexOf(votedBy.stvId);
            const stv = unchangedStvVotesWithWeightAndActiveRank[indexOfStv];
            unchangedStvVotesWithWeightAndActiveRank = [
                ...unchangedStvVotesWithWeightAndActiveRank.slice(0, indexOfStv),
                ...unchangedStvVotesWithWeightAndActiveRank.slice(indexOfStv + 1),
            ];
            let nextActiveRank: number | null = stv.activeRank + 1;
            let nextVote: Vote | null = stv.votes[nextActiveRank];
            while (
                nextActiveRank &&
                nextVote &&
                (winners.includes(nextVote.alternativeId) || losers.includes(nextVote.alternativeId))
            ) {
                nextActiveRank = stv.votes.length > nextActiveRank + 1 ? nextActiveRank + 1 : null;
                nextVote = nextActiveRank ? stv.votes[nextActiveRank] : null;
            }
            updatedStvVotesWithWeightAndActiveRank.push({
                ...stv,
                weight: stv.weight * weightOfNextVotes,
                activeRank: nextActiveRank ?? -1,
            });
        });
    });
    return { unchanged: unchangedStvVotesWithWeightAndActiveRank, updated: updatedStvVotesWithWeightAndActiveRank };
};

const computeStvResult = async (ctx: Context, votation: Votation, alternatives: Alternative[]) => {
    // keep track of what alternatives has been eliminated as winners or losers
    const winners: string[] = [];
    const losers: string[] = [];

    let alternativeIdToVoteCount: AlternativeIdToVoteCount = {};
    const alternativeIds = alternatives.map((a) => a.id);
    alternativeIds.forEach((alternative) => (alternativeIdToVoteCount[alternative] = { voteCount: 0, votedBy: [] }));

    const hasVoted = await ctx.prisma.hasVoted.count({
        where: {
            votationId: votation.id,
        },
    });
    const quota = Math.floor(hasVoted / (votation.numberOfWinners + 1)) + 1;
    const stvVotes = await ctx.prisma.stvVote.findMany({
        select: {
            id: true,
            votes: true,
        },
        where: {
            votationId: votation.id,
        },
    });
    let stvVotesWithWeightAndActiveRank: StvVoteWithWeightAndActiveRank[] = stvVotes.map((vote) => {
        const sortedVotes = vote.votes.sort((a, b) => a.ranking - b.ranking);
        return {
            id: vote.id,
            votes: sortedVotes,
            weight: 1,
            activeRank: 0,
        };
    });
    // the first round everyone first vote should be counted, and are therefore regarded as "redistributed voted"
    let updatedStvVotesWithWeightAndActiveRank = [...stvVotesWithWeightAndActiveRank];

    let roundNr = 1;
    while (winners.length < votation.numberOfWinners) {
        // console.log('round:', roundNr);
        roundNr += 1;
        // Every new round, some votes has been redistributed from the winners or losers of that round
        // and the votecount for the alternatives receiving those votes are here updated
        // console.log('updated stv votes', updatedStvVotesWithWeightAndActiveRank);

        updatedStvVotesWithWeightAndActiveRank.forEach((stvVote) => {
            // console.log('votes', stvVote.votes);
            const activeVote = stvVote.votes.filter((v) => v.ranking === stvVote.activeRank);
            // console.log('active vote', activeVote);
            if (activeVote.length > 0 && activeVote[0]) {
                alternativeIdToVoteCount[activeVote[0].alternativeId].voteCount += stvVote.weight;
                alternativeIdToVoteCount[activeVote[0].alternativeId].votedBy.push({
                    stvId: stvVote.id,
                    weight: stvVote.weight,
                });
            }
        });
        // console.log('voteCount', alternativeIdToVoteCount);
        const roundWinners = alternativeIds.filter(
            (key) => !winners.includes(key) && !losers.includes(key) && alternativeIdToVoteCount[key].voteCount >= quota
        );
        // console.log('roundwinners', roundWinners);
        if (roundWinners.length > 0) {
            winners.push(...roundWinners);
            const { unchanged, updated } = redistributeVotes(
                roundWinners,
                alternativeIdToVoteCount,
                quota,
                stvVotesWithWeightAndActiveRank,
                winners,
                losers
            );
            stvVotesWithWeightAndActiveRank = [...unchanged, ...updated];
            updatedStvVotesWithWeightAndActiveRank = updated;
        }
        // if the round has no winners, but the number remaining alternatives (not winners or losers) plus the number of appointed winners
        // is less than the desired number of winners, all remaining alternatives are appointed winners.
        else if (
            alternativeIds.filter((id) => !winners.includes(id) && !losers.includes(id)).length + winners.length <=
            votation.numberOfWinners
        ) {
            return [...winners, ...alternativeIds.filter((id) => !winners.includes(id) && !losers.includes(id))];
        }
        // if the round has no winners and there are too many alternatives left to appoint all as winners, the alternative with
        // least votes, is removed, and its votes are redistributed
        else {
            let roundLosers: VotationResult[] = [];
            alternativeIds
                .filter((id) => !winners.includes(id) && !losers.includes(id))
                .forEach((id) => {
                    const count = alternativeIdToVoteCount[id].voteCount;
                    if (roundLosers.length === 0 || count < roundLosers[0].count) {
                        roundLosers = [{ id, count }];
                    } else if (roundLosers[0].count === count) roundLosers.push({ id, count });
                });
            roundLosers.forEach((l) => losers.push(l.id));
            // console.log('roundLosers', roundLosers);
            const { unchanged, updated } = redistributeVotes(
                roundLosers.map((a) => a.id),
                alternativeIdToVoteCount,
                quota,
                stvVotesWithWeightAndActiveRank,
                winners,
                losers
            );
            stvVotesWithWeightAndActiveRank = [...unchanged, ...updated];
            updatedStvVotesWithWeightAndActiveRank = updated;
        }
    }
    // console.log('winners', winners);
    return winners;
};

const computeResult = async (ctx: Context, votation: Votation) => {
    const alternatives = await ctx.prisma.alternative.findMany({
        where: {
            votationId: votation.id,
        },
    });
    switch (votation?.type) {
        case 'SIMPLE':
            return await computeSimpleResult(ctx, alternatives);
        case 'QUALIFIED':
            return await computeQualifiedResult(ctx, votation, alternatives);
        case 'STV':
            return await computeStvResult(ctx, votation, alternatives);
        default:
            return [];
    }
};

export const setWinner = async (ctx: Context, votationId: string) => {
    const votation = await ctx.prisma.votation.findUnique({
        where: {
            id: votationId,
        },
    });
    if (!votation) throw new Error('Votation does not exist.');
    const winners = await computeResult(ctx, votation);
    const promises: Promise<Alternative>[] = [];
    if (winners.length <= votation.numberOfWinners) {
        winners.forEach((winner) =>
            promises.push(
                ctx.prisma.alternative.update({
                    where: {
                        id: winner,
                    },
                    data: {
                        isWinner: true,
                    },
                })
            )
        );
    }
    await Promise.all(promises);
};
