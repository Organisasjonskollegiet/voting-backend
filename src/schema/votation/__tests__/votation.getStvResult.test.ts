import { createMeeting, createVotation, createAlternative, createUser, castStvVote } from '../../../lib/tests/utils';
import { createTestContext } from '../../../lib/tests/testContext';
import { VotationStatus, Role, VotationType, Vote } from '.prisma/client';
import { setWinner, computeResult } from '../utils';
import casual from 'casual';
import { gql } from 'graphql-request';
const ctx = createTestContext();

it('should return andrea and carter as winners', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.ADMIN, true);
    const votation = await createVotation(ctx, meeting.id, VotationStatus.PUBLISHED_RESULT, 1, VotationType.STV, 2);
    const andrea = await createAlternative(ctx, votation.id, casual.title);
    const brad = await createAlternative(ctx, votation.id, casual.title);
    const carter = await createAlternative(ctx, votation.id, casual.title);
    const delilah = await createAlternative(ctx, votation.id, casual.title);
    const promises: Promise<Vote[]>[] = [];
    for (let i = 0; i < 16; i++) {
        promises.push(
            new Promise(async (resolve, reject) => {
                try {
                    const user = await createUser(ctx);
                    const votes = await castStvVote(
                        ctx,
                        votation.id,
                        [
                            { id: andrea.id, ranking: 0 },
                            { id: brad.id, ranking: 1 },
                            { id: carter.id, ranking: 2 },
                            { id: delilah.id, ranking: 3 },
                        ],
                        user.id
                    );
                    resolve(votes);
                } catch (error) {
                    reject(error);
                }
            })
        );
    }
    for (let i = 0; i < 24; i++) {
        promises.push(
            new Promise(async (resolve, reject) => {
                try {
                    const user = await createUser(ctx);
                    const votes = await castStvVote(
                        ctx,
                        votation.id,
                        [
                            { id: andrea.id, ranking: 0 },
                            { id: carter.id, ranking: 1 },
                            { id: brad.id, ranking: 2 },
                            { id: delilah.id, ranking: 3 },
                        ],
                        user.id
                    );
                    resolve(votes);
                } catch (error) {
                    reject(error);
                }
            })
        );
    }
    for (let i = 0; i < 17; i++) {
        promises.push(
            new Promise(async (resolve, reject) => {
                try {
                    const user = await createUser(ctx);
                    const votes = await castStvVote(
                        ctx,
                        votation.id,
                        [
                            { id: delilah.id, ranking: 0 },
                            { id: andrea.id, ranking: 1 },
                            { id: brad.id, ranking: 2 },
                            { id: carter.id, ranking: 3 },
                        ],
                        user.id
                    );
                    resolve(votes);
                } catch (error) {
                    reject(error);
                }
            })
        );
    }
    await Promise.all(promises);
    const result = await computeResult(ctx, votation);
    expect(result.length).toBe(2);
    expect(result.includes(andrea.id)).toBeTruthy();
    expect(result.includes(carter.id)).toBeTruthy();
});

it('should register correct round results', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.ADMIN, true);
    const votation = await createVotation(ctx, meeting.id, VotationStatus.OPEN, 0, VotationType.STV, 2);
    const andrea = await createAlternative(ctx, votation.id, 'andrea');
    const carter = await createAlternative(ctx, votation.id, 'carter');
    const brad = await createAlternative(ctx, votation.id, 'brad');
    const delilah = await createAlternative(ctx, votation.id, 'delilah');
    const promises = [];
    promises.push(
        new Promise(async (resolve, reject) => {
            try {
                const user = await createUser(ctx);
                const votes = await castStvVote(
                    ctx,
                    votation.id,
                    [
                        { id: andrea.id, ranking: 0 },
                        { id: carter.id, ranking: 1 },
                        { id: brad.id, ranking: 2 },
                        { id: delilah.id, ranking: 3 },
                    ],
                    user.id
                );
                resolve(votes);
            } catch (error) {
                reject(error);
            }
        })
    );
    promises.push(
        new Promise(async (resolve, reject) => {
            try {
                const user = await createUser(ctx);
                const votes = await castStvVote(
                    ctx,
                    votation.id,
                    [
                        { id: andrea.id, ranking: 0 },
                        { id: brad.id, ranking: 1 },
                        { id: carter.id, ranking: 2 },
                        { id: delilah.id, ranking: 3 },
                    ],
                    user.id
                );
                resolve(votes);
            } catch (error) {
                reject(error);
            }
        })
    );
    await Promise.all(promises);
    await setWinner(ctx, votation.id);
    const stvResult = await ctx.prisma.stvResult.findUnique({
        where: {
            votationId: votation.id,
        },
    });
    const stvRoundResults = await ctx.prisma.stvRoundResult.findMany({
        where: {
            stvResultId: votation.id,
        },
        select: {
            index: true,
            winners: true,
            losers: true,
            alternativesWithRoundVoteCount: true,
        },
    });
    expect(stvResult?.quota).toBe(1);
    expect(stvRoundResults.find((r) => r.index === 0)?.winners.map((a) => a.id)).toContain(andrea.id);
    expect(stvRoundResults.find((r) => r.index === 1)?.losers.map((a) => a.id)).toContain(delilah.id);
    expect(stvRoundResults.find((r) => r.index === 2)?.losers).toHaveLength(1);
    expect(stvRoundResults.find((r) => r.index === 3)?.winners).toHaveLength(1);
    expect(
        stvRoundResults
            .find((r) => r.index === 0)
            ?.alternativesWithRoundVoteCount.find((a) => a.alterantiveId === andrea.id)?.voteCount
    ).toEqual(2);
    expect(
        stvRoundResults
            .find((r) => r.index === 1)
            ?.alternativesWithRoundVoteCount.find((a) => a.alterantiveId === brad.id)?.voteCount
    ).toEqual(0.5);
    expect(
        stvRoundResults
            .find((r) => r.index === 1)
            ?.alternativesWithRoundVoteCount.find((a) => a.alterantiveId === carter.id)?.voteCount
    ).toEqual(0.5);
});

it('should return round results for checking result stv votation as counter', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.COUNTER, true);
    const votation = await createVotation(ctx, meeting.id, VotationStatus.CHECKING_RESULT, 0, VotationType.STV, 2);
    const andrea = await createAlternative(ctx, votation.id, 'andrea');
    const brad = await createAlternative(ctx, votation.id, 'brad');
    await new Promise(async (resolve, reject) => {
        try {
            const user = await createUser(ctx);
            const votes = await castStvVote(
                ctx,
                votation.id,
                [
                    { id: andrea.id, ranking: 0 },
                    { id: brad.id, ranking: 1 },
                ],
                user.id
            );
            resolve(votes);
        } catch (error) {
            reject(error);
        }
    });
    await setWinner(ctx, votation.id);
    const response = await ctx.client.request(
        gql`
            query GetStvResult($votationId: String!) {
                getStvResult(votationId: $votationId) {
                    votationId
                    quota
                    voteCount
                    votingEligibleCount
                    stvRoundResults {
                        index
                        winners {
                            votationId
                            id
                            text
                        }
                        losers {
                            text
                        }
                        alternativesWithRoundVoteCount {
                            alternative {
                                id
                                text
                            }
                            voteCount
                        }
                    }
                }
            }
        `,
        {
            votationId: votation.id,
        }
    );
    expect(response.getStvResult.stvRoundResults).toHaveLength(2);
    expect(response.getStvResult.stvRoundResults[0].alternativesWithRoundVoteCount).toHaveLength(2);
});

it('should return round results for published result with hiddenVotes false stv votation as Participant ', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.PARTICIPANT, true);
    const votation = await createVotation(
        ctx,
        meeting.id,
        VotationStatus.PUBLISHED_RESULT,
        0,
        VotationType.STV,
        2,
        0,
        false,
        false
    );
    const andrea = await createAlternative(ctx, votation.id, 'andrea');
    const brad = await createAlternative(ctx, votation.id, 'brad');
    await new Promise(async (resolve, reject) => {
        try {
            const user = await createUser(ctx);
            const votes = await castStvVote(
                ctx,
                votation.id,
                [
                    { id: andrea.id, ranking: 0 },
                    { id: brad.id, ranking: 1 },
                ],
                user.id
            );
            resolve(votes);
        } catch (error) {
            reject(error);
        }
    });
    await setWinner(ctx, votation.id);
    const response = await ctx.client.request(
        gql`
            query GetStvResult($votationId: String!) {
                getStvResult(votationId: $votationId) {
                    votationId
                    quota
                    voteCount
                    votingEligibleCount
                    stvRoundResults {
                        index
                        winners {
                            votationId
                            id
                            text
                        }
                        losers {
                            text
                        }
                        alternativesWithRoundVoteCount {
                            alternative {
                                id
                                text
                            }
                            voteCount
                        }
                    }
                }
            }
        `,
        {
            votationId: votation.id,
        }
    );
    expect(response.getStvResult.stvRoundResults).toHaveLength(2);
    expect(response.getStvResult.stvRoundResults[0].alternativesWithRoundVoteCount).toHaveLength(2);
});

it('should return not authorised trying to get round results for checking result with hiddenVotes false stv votation as Participant ', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.PARTICIPANT, true);
    const votation = await createVotation(
        ctx,
        meeting.id,
        VotationStatus.CHECKING_RESULT,
        0,
        VotationType.STV,
        2,
        0,
        false,
        false
    );
    const andrea = await createAlternative(ctx, votation.id, 'andrea');
    const brad = await createAlternative(ctx, votation.id, 'brad');
    await new Promise(async (resolve, reject) => {
        try {
            const user = await createUser(ctx);
            const votes = await castStvVote(
                ctx,
                votation.id,
                [
                    { id: andrea.id, ranking: 0 },
                    { id: brad.id, ranking: 1 },
                ],
                user.id
            );
            resolve(votes);
        } catch (error) {
            reject(error);
        }
    });
    await setWinner(ctx, votation.id);
    try {
        await ctx.client.request(
            gql`
                query GetStvResult($votationId: String!) {
                    getStvResult(votationId: $votationId) {
                        votationId
                        quota
                        voteCount
                        votingEligibleCount
                        stvRoundResults {
                            index
                            winners {
                                votationId
                                id
                                text
                            }
                            losers {
                                text
                            }
                            alternativesWithRoundVoteCount {
                                alternative {
                                    id
                                    text
                                }
                                voteCount
                            }
                        }
                    }
                }
            `,
            {
                votationId: votation.id,
            }
        );
        expect(false).toBeTruthy();
    } catch (error: any) {
        expect(error.message).toContain('Not Authorised!');
    }
});

it('should return not authorised trying to get round results for published result with hiddenVotes true stv votation as Participant ', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.PARTICIPANT, true);
    const votation = await createVotation(ctx, meeting.id, VotationStatus.CHECKING_RESULT, 0, VotationType.STV, 1);
    const andrea = await createAlternative(ctx, votation.id, 'andrea');
    await new Promise(async (resolve, reject) => {
        try {
            const user = await createUser(ctx);
            const votes = await castStvVote(ctx, votation.id, [{ id: andrea.id, ranking: 0 }], user.id);
            resolve(votes);
        } catch (error) {
            reject(error);
        }
    });
    await setWinner(ctx, votation.id);
    try {
        await ctx.client.request(
            gql`
                query GetStvResult($votationId: String!) {
                    getStvResult(votationId: $votationId) {
                        votationId
                        quota
                        voteCount
                        votingEligibleCount
                        stvRoundResults {
                            index
                            winners {
                                votationId
                                id
                                text
                            }
                            losers {
                                text
                            }
                            alternativesWithRoundVoteCount {
                                alternative {
                                    id
                                    text
                                }
                                voteCount
                            }
                        }
                    }
                }
            `,
            {
                votationId: votation.id,
            }
        );
        expect(false).toBeTruthy();
    } catch (error: any) {
        expect(error.message).toContain('Not Authorised!');
    }
});
