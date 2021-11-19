import {
    createMeeting,
    createVotation,
    createAlternative,
    createUser,
    castStvVote,
    createParticipant,
    alternative1Text,
    vote,
    alternative2Text,
} from '../../../lib/tests/utils';
import { createTestContext } from '../../../lib/tests/testContext';
import { VotationStatus, Role, Vote, VotationType } from '.prisma/client';
import casual from 'casual';
import { gql } from 'graphql-request';
import { setWinner } from '../utils';
import { Alternative } from '@prisma/client';
const ctx = createTestContext();

it('should return andrea and carter as winners for stv votation', async () => {
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
    await setWinner(ctx, votation.id);
    const alternatives = await ctx.prisma.alternative.findMany({ where: { votationId: votation.id, isWinner: true } });
    const winnerIds = alternatives.map((a) => a.id);
    expect(alternatives.length).toBe(2);
    expect(winnerIds.includes(andrea.id)).toBeTruthy();
    expect(winnerIds.includes(carter.id)).toBeTruthy();
});

it('should return alternative1 as winner with simple majority', async () => {
    const user1 = await createUser(ctx);
    const user2 = await createUser(ctx);
    const meeting = await createMeeting(ctx, ctx.userId, Role.ADMIN, true);
    await createParticipant(ctx, meeting.id, user1.id, true, Role.PARTICIPANT);
    await createParticipant(ctx, meeting.id, user2.id, true, Role.PARTICIPANT);
    const votation = await createVotation(ctx, meeting.id, VotationStatus.CHECKING_RESULT, 1, VotationType.SIMPLE);
    const alternative1 = await createAlternative(ctx, votation.id, alternative1Text);
    const alternative2 = await createAlternative(ctx, votation.id, alternative2Text);
    await vote(ctx, votation.id, ctx.userId, alternative1.id);
    await vote(ctx, votation.id, user1.id, alternative1.id);
    await vote(ctx, votation.id, user2.id, alternative2.id);
    await setWinner(ctx, votation.id);
    const response = await ctx.client.request(
        gql`
            query GetVotationResults($votationId: String!) {
                result(votationId: $votationId) {
                    alternatives {
                        id
                        text
                        index
                        votationId
                        isWinner
                        votes
                    }
                    blankVoteCount
                    votingEligibleCount
                    voteCount
                }
            }
        `,
        {
            votationId: votation.id,
        }
    );
    expect(
        response.result.alternatives.map((a: Alternative) => {
            return { ...a, loserOfStvRoundId: null, winnerOfStvRoundId: null };
        })
    ).toEqual(
        expect.arrayContaining([
            {
                ...alternative1,
                isWinner: true,
                votes: 2,
            },
            {
                ...alternative2,
                isWinner: false,
                votes: 1,
            },
        ])
    );
    expect(response.result.votingEligibleCount).toEqual(3);
    expect(response.result.voteCount).toEqual(3);
});

it('should return no winner with simple majority when the alternatives has equal amount of votes', async () => {
    const user1 = await createUser(ctx);
    const meeting = await createMeeting(ctx, ctx.userId, Role.ADMIN, true);
    await createParticipant(ctx, meeting.id, user1.id, true, Role.PARTICIPANT);
    const votation = await createVotation(ctx, meeting.id, VotationStatus.CHECKING_RESULT, 1, VotationType.SIMPLE);
    const alternative1 = await createAlternative(ctx, votation.id, alternative1Text);
    const alternative2 = await createAlternative(ctx, votation.id, alternative2Text);
    await vote(ctx, votation.id, ctx.userId, alternative1.id);
    await vote(ctx, votation.id, user1.id, alternative2.id);
    await setWinner(ctx, votation.id);
    const response = await ctx.client.request(
        gql`
            query GetVotationResults($votationId: String!) {
                result(votationId: $votationId) {
                    alternatives {
                        id
                        text
                        index
                        votationId
                        isWinner
                        votes
                    }
                    blankVoteCount
                    votingEligibleCount
                    voteCount
                }
            }
        `,
        {
            votationId: votation.id,
        }
    );
    expect(
        response.result.alternatives.map((a: Alternative) => {
            return { ...a, loserOfStvRoundId: null, winnerOfStvRoundId: null };
        })
    ).toEqual(
        expect.arrayContaining([
            {
                ...alternative1,
                isWinner: false,
                votes: 1,
            },
            {
                ...alternative2,
                isWinner: false,
                votes: 1,
            },
        ])
    );
    expect(response.result.votingEligibleCount).toEqual(2);
    expect(response.result.voteCount).toEqual(2);
});

it('should return alternative1 as winner with qualified over 66%', async () => {
    const user1 = await createUser(ctx);
    const user2 = await createUser(ctx);
    const meeting = await createMeeting(ctx, ctx.userId, Role.ADMIN, true);
    await createParticipant(ctx, meeting.id, user1.id, true, Role.PARTICIPANT);
    await createParticipant(ctx, meeting.id, user2.id, true, Role.PARTICIPANT);
    const votation = await createVotation(
        ctx,
        meeting.id,
        VotationStatus.CHECKING_RESULT,
        1,
        VotationType.QUALIFIED,
        1,
        66
    );
    const alternative1 = await createAlternative(ctx, votation.id, alternative1Text);
    const alternative2 = await createAlternative(ctx, votation.id, alternative2Text);
    await vote(ctx, votation.id, ctx.userId, alternative1.id);
    await vote(ctx, votation.id, user1.id, alternative1.id);
    await vote(ctx, votation.id, user2.id, alternative2.id);
    await setWinner(ctx, votation.id);
    const response = await ctx.client.request(
        gql`
            query GetVotationResults($votationId: String!) {
                result(votationId: $votationId) {
                    alternatives {
                        id
                        text
                        index
                        votationId
                        isWinner
                        votes
                    }
                    blankVoteCount
                    votingEligibleCount
                    voteCount
                }
            }
        `,
        {
            votationId: votation.id,
        }
    );
    expect(
        response.result.alternatives.map((a: Alternative) => {
            return { ...a, loserOfStvRoundId: null, winnerOfStvRoundId: null };
        })
    ).toEqual(
        expect.arrayContaining([
            {
                ...alternative1,
                isWinner: true,
                votes: 2,
            },
            {
                ...alternative2,
                isWinner: false,
                votes: 1,
            },
        ])
    );
    expect(response.result.votingEligibleCount).toEqual(3);
    expect(response.result.voteCount).toEqual(3);
});

it('should return no winner with qualified over 67%', async () => {
    const user1 = await createUser(ctx);
    const user2 = await createUser(ctx);
    const meeting = await createMeeting(ctx, ctx.userId, Role.COUNTER, true);
    await createParticipant(ctx, meeting.id, user1.id, true, Role.PARTICIPANT);
    await createParticipant(ctx, meeting.id, user2.id, true, Role.PARTICIPANT);
    const votation = await createVotation(
        ctx,
        meeting.id,
        VotationStatus.CHECKING_RESULT,
        1,
        VotationType.QUALIFIED,
        1,
        67
    );
    const alternative1 = await createAlternative(ctx, votation.id, alternative1Text);
    const alternative2 = await createAlternative(ctx, votation.id, alternative2Text);
    await vote(ctx, votation.id, ctx.userId, alternative1.id);
    await vote(ctx, votation.id, user1.id, alternative1.id);
    await vote(ctx, votation.id, user2.id, alternative2.id);
    await setWinner(ctx, votation.id);
    const response = await ctx.client.request(
        gql`
            query GetVotationResults($votationId: String!) {
                result(votationId: $votationId) {
                    alternatives {
                        id
                        text
                        index
                        votationId
                        isWinner
                        votes
                    }
                    blankVoteCount
                    votingEligibleCount
                    voteCount
                }
            }
        `,
        {
            votationId: votation.id,
        }
    );
    expect(
        response.result.alternatives.map((a: Alternative) => {
            return { ...a, loserOfStvRoundId: null, winnerOfStvRoundId: null };
        })
    ).toEqual(
        expect.arrayContaining([
            {
                ...alternative1,
                isWinner: false,
                votes: 2,
                loserOfStvRoundId: null,
                winnerOfStvRoundId: null,
            },
            {
                ...alternative2,
                isWinner: false,
                votes: 1,
                loserOfStvRoundId: null,
                winnerOfStvRoundId: null,
            },
        ])
    );
    expect(response.result.votingEligibleCount).toEqual(3);
    expect(response.result.voteCount).toEqual(3);
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
    const stvResult = await ctx.prisma.votationResult.findUnique({
        where: {
            votationId: votation.id,
        },
    });
    const stvRoundResults = await ctx.prisma.stvRoundResult.findMany({
        where: {
            resultId: votation.id,
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
            query GetVotationResult($votationId: String!) {
                result(votationId: $votationId) {
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
    expect(response.result.stvRoundResults).toHaveLength(2);
    expect(response.result.stvRoundResults[0].alternativesWithRoundVoteCount).toHaveLength(2);
});

it('should return not authorised trying to get votation results of published votataion as participant with hiddenvotes true', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.PARTICIPANT, true);
    const votation = await createVotation(
        ctx,
        meeting.id,
        VotationStatus.PUBLISHED_RESULT,
        1,
        VotationType.QUALIFIED,
        1,
        67
    );
    const alternative1 = await createAlternative(ctx, votation.id, alternative1Text);
    await vote(ctx, votation.id, ctx.userId, alternative1.id);
    await setWinner(ctx, votation.id);
    try {
        await ctx.client.request(
            gql`
                query GetVotationResults($votationId: String!) {
                    result(votationId: $votationId) {
                        alternatives {
                            id
                            text
                            votationId
                            isWinner
                            votes
                        }
                        blankVoteCount
                        votingEligibleCount
                        voteCount
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
            query GetVotationResult($votationId: String!) {
                result(votationId: $votationId) {
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
    expect(response.result.stvRoundResults).toHaveLength(2);
    expect(response.result.stvRoundResults[0].alternativesWithRoundVoteCount).toHaveLength(2);
});

it('should return not authorised trying to get round results for checking result with hiddenVotes true stv votation as Participant ', async () => {
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
                query GetVotationResult($votationId: String!) {
                    result(votationId: $votationId) {
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
