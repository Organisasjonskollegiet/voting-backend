import { Alternative, Votation, VotationType, Vote } from '@prisma/client';
import { Context } from '../../context';
/**
 * @description Object consisting of alternative id and the current vote count.
 */
type VotationResult = {
    id: string;
    count: number;
};

/**
 * @description Mapping between alternativeId and both its vote count and which ballots (stvVote) have active vote for
 * that alternative along with the weight of that specific vote. The weight is reduced so that all the redistributed
 * votes from a winner will have a combined weight equal to the surplus (number of votes - quota).
 */
interface AlternativeIdToVoteCount {
    [id: string]: {
        voteCount: number;
        votedBy: {
            stvId: string;
            weight: number;
        }[];
    };
}

/**
 * @description STV vote including the index (rank) of the active alternative of that stvVote as well as the weight.
 * The active alternative is the alternative with the highest preference that is not yet declared winner or loser.
 * The weight is used when computing the vote count of the active alternative. The first vote going to the first
 * alternative on an STV vote always have weight 1, but the weight is reduced when redistributed from a winner.
 */
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

// the votes that has gone to this round's winners are redistributed for next round, with the
// overall weight of the redistributed votes is equal to the surplus (voteCount - quota)
// each redistributed vote will therefore have a weight of 1 / (voteCount - quota) compared to it's previous weight
/**
 * @summary Redistributes votes from the winners or losers of this round to the next alternative on their ballot (stvVote)
 *
 * @description This function update the weight and activeRank of stvVotes, that will be used in the next round.
 * The votes from this round's winners or losers are redistributed to the next alternative on the ballot (stvVote).
 * If the redistributed votes comes from a loser, the redistributed vote will have the same weight as the vote with the
 * loser. If the redistributed vote comes from a winner, the weight of the redistributed vote is reduced. The weight is
 * reduced so that all the votes transferred will have a combined weight equal to the vote surplus. The vote surplus is
 * number of votes for that alternative minus the quota.
 *
 * @param eliminatedAlternatives The alternatives whose votes will be redistributed. They are either winners of losers.
 * @param alternativeIdToVoteCount Mapping between the alternative and both the number of votes and which ballot (stvVote) the votes comes from.
 * @param quota An alternative with more votes than the quota is declared winner. Used to compute surplus, which is explained in the description.
 * @param stvVotesWithWeightAndActiveRank
 * @param winners List of the ids of the alternatives declared winners so far
 * @param losers  List of the ids if the alternatives declared losers so far
 * @returns an object containing both the unchanged and the updated
 */
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
    // go through all winners or losers
    eliminatedAlternatives.forEach((eliminatedAlternative) => {
        const winnerObject = alternativeIdToVoteCount[eliminatedAlternative];
        const surplus = winnerObject.voteCount - quota;
        const weightOfNextVotes = surplus >= 0 ? surplus / winnerObject.voteCount : 1;
        // redistribute the votes for that alternative according to the next alternative
        // on the Stv votes
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

const getQuota = async (ctx: Context, votation: Votation) => {
    const hasVoted = await ctx.prisma.hasVoted.count({
        where: {
            votationId: votation.id,
        },
    });
    return Math.floor(hasVoted / (votation.numberOfWinners + 1)) + 1;
};

const getStvVotes = async (ctx: Context, votationId: string) => {
    return await ctx.prisma.stvVote.findMany({
        select: {
            id: true,
            votes: true,
        },
        where: {
            votationId,
        },
    });
};

/**
 * @summary Removes losers randomly so there will be enough remaining alternatives after the round.
 *
 * @description After a round it always has to be enough alternatives left to elect the desired number of winners.
 * If there are too many temporary losers to declare all losers, alternatives are randomly removed from
 * being losers. This is done until we reach a state where there will be enough alternatives left after
 * the round, to get the desired number of winners.
 *
 * @param tempLosers The alternatives with the least votes. They will always have the same amount of votes.
 * @param winnersLeftToPick The number of winners still to be elected.
 * @param alternativesRemaining The number of alternatives that have not been declared winner or loser so far.
 *
 * @returns the alternatives to be declared as losers this round.
 */
const trimLosers = (tempLosers: VotationResult[], winnersLeftToPick: number, alternativesRemaining: number) => {
    let newLosers = [...tempLosers];
    while (winnersLeftToPick > alternativesRemaining - newLosers.length) {
        const indexOfAlternativeToRemove = Math.floor(Math.random() * newLosers.length);
        newLosers = newLosers.filter((_, index) => index !== indexOfAlternativeToRemove);
    }
    return newLosers;
};

const computeStvResult = async (ctx: Context, votation: Votation, alternatives: Alternative[]) => {
    // keep track of what alternatives has been eliminated as winners or losers
    if (votation.numberOfWinners >= alternatives.length) return alternatives.map((a) => a.id);
    const winners: string[] = [];
    const losers: string[] = [];

    let alternativeIdToVoteCount: AlternativeIdToVoteCount = {};
    const alternativeIds = alternatives.map((a) => a.id);
    alternativeIds.forEach((alternative) => (alternativeIdToVoteCount[alternative] = { voteCount: 0, votedBy: [] }));

    const quota = await getQuota(ctx, votation);
    const stvVotes = await getStvVotes(ctx, votation.id);

    // create result in db
    const stvResult = await ctx.prisma.stvResult.create({
        data: {
            votationId: votation.id,
            quota,
        },
    });

    // this variable is used to keep track of each ballot/stvVote. When a stvVotes "active" vote is declared
    // winner or loser, stvVotesWithWeightAndActiveRank is used to redistribute the votes correctly
    let stvVotesWithWeightAndActiveRank: StvVoteWithWeightAndActiveRank[] = stvVotes.map((vote) => {
        const sortedVotes = vote.votes.sort((a, b) => a.ranking - b.ranking);
        return {
            id: vote.id,
            votes: sortedVotes,
            weight: 1,
            activeRank: 0,
        };
    });

    // When the alternative on the "active" vote of an stvVote is declared winner or loser, the votes are
    // redistributed. updatedStvVotesWithWeightAndActiveRank tells us which one to
    // the first round everyone's first vote should be counted, and are therefore regarded as updated votes
    let updatedStvVotesWithWeightAndActiveRank = [...stvVotesWithWeightAndActiveRank];

    let roundNr = 0;
    while (winners.length < votation.numberOfWinners && roundNr < alternativeIds.length) {
        // The vote count of the alternatives are updated with the redistributed votes.
        updatedStvVotesWithWeightAndActiveRank.forEach((stvVote) => {
            const activeVote = stvVote.votes.find((v) => v.ranking === stvVote.activeRank);
            if (activeVote) {
                alternativeIdToVoteCount[activeVote.alternativeId].voteCount += stvVote.weight;
                alternativeIdToVoteCount[activeVote.alternativeId].votedBy.push({
                    stvId: stvVote.id,
                    weight: stvVote.weight,
                });
            }
        });

        const stvRoundResult = await ctx.prisma.stvRoundResult.create({
            data: {
                stvResultId: stvResult.votationId,
                index: roundNr,
            },
        });

        // add this rounds alternative-to-vote-count to db
        await Promise.all(
            alternativeIds
                .filter((a) => ![...winners, ...losers].includes(a))
                .map((id) =>
                    ctx.prisma.alternativeRoundVoteCount.create({
                        data: {
                            alterantiveId: id,
                            voteCount: alternativeIdToVoteCount[id].voteCount,
                            stvRoundResultId: stvRoundResult.id,
                        },
                    })
                )
        );

        // alternatives with a vote count higher than the quota are winners
        const roundWinners = alternativeIds.filter(
            (key) => !winners.includes(key) && !losers.includes(key) && alternativeIdToVoteCount[key].voteCount >= quota
        );
        if (roundWinners.length > 0) {
            winners.push(...roundWinners);
            // save this rounds winners to db
            await Promise.all(
                roundWinners.map((alternativeId) =>
                    ctx.prisma.alternative.update({
                        where: {
                            id: alternativeId,
                        },
                        data: {
                            winnerOfStvRoundId: stvRoundResult.id,
                        },
                    })
                )
            );
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
        // if the round has no winners, but the number remaining alternatives (all alternatives minus winners and losers) plus the number of appointed winners
        // is less than or equal to the desired number of winners, all remaining alternatives are appointed winners.
        else if (
            alternativeIds.filter((id) => !winners.includes(id) && !losers.includes(id)).length + winners.length <=
            votation.numberOfWinners
        ) {
            const roundWinners = alternativeIds.filter((id) => !winners.includes(id) && !losers.includes(id));
            // save this rounds winners to db
            await Promise.all(
                roundWinners.map((alternativeId) =>
                    ctx.prisma.alternative.update({
                        where: {
                            id: alternativeId,
                        },
                        data: {
                            winnerOfStvRoundId: stvRoundResult.id,
                        },
                    })
                )
            );
            return [...winners, ...roundWinners];
        }
        // if the round has no winners and there are too many alternatives left to appoint all as winners, the alternative with
        // least votes, is removed, and its votes are redistributed
        else {
            let tempRoundLosers: VotationResult[] = [];
            alternativeIds
                .filter((id) => !winners.includes(id) && !losers.includes(id))
                .forEach((id) => {
                    const count = alternativeIdToVoteCount[id].voteCount;
                    if (tempRoundLosers.length === 0 || count < tempRoundLosers[0].count) {
                        tempRoundLosers = [{ id, count }];
                    } else if (tempRoundLosers[0].count === count) tempRoundLosers.push({ id, count });
                });
            const undecidedAlternatives = alternatives.length - winners.length - losers.length;
            const winnersLeftToPick = votation.numberOfWinners - winners.length;
            let roundLosers = trimLosers(tempRoundLosers, winnersLeftToPick, undecidedAlternatives);
            // save this rounds losers to db
            await Promise.all(
                roundLosers.map((alternative) =>
                    ctx.prisma.alternative.update({
                        where: {
                            id: alternative.id,
                        },
                        data: {
                            loserOfStvRoundId: stvRoundResult.id,
                        },
                    })
                )
            );
            roundLosers.forEach((l) => losers.push(l.id));
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

        roundNr += 1;
    }
    return winners;
};

export const computeResult = async (ctx: Context, votation: Votation) => {
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
    if (
        (votation.type !== VotationType.STV && winners.length === 1) ||
        (votation.type === VotationType.STV && winners.length <= votation.numberOfWinners)
    ) {
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
