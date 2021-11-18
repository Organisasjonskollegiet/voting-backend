import {
    createMeeting,
    createVotation,
    createAlternative,
    createUser,
    createParticipant,
    vote,
    alternative1Text,
    alternative2Text,
} from '../../../lib/tests/utils';
import { createTestContext } from '../../../lib/tests/testContext';
import { VotationStatus, Role, VotationType } from '.prisma/client';
import { setWinner } from '../utils';
import { gql } from 'graphql-request';
import { Alternative } from '@prisma/client';
const ctx = createTestContext();

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
                getVotationResults(votationId: $votationId) {
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
        response.getVotationResults.alternatives.map((a: Alternative) => {
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
    expect(response.getVotationResults.votingEligibleCount).toEqual(3);
    expect(response.getVotationResults.voteCount).toEqual(3);
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
                getVotationResults(votationId: $votationId) {
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
        response.getVotationResults.alternatives.map((a: Alternative) => {
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
    expect(response.getVotationResults.votingEligibleCount).toEqual(2);
    expect(response.getVotationResults.voteCount).toEqual(2);
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
                getVotationResults(votationId: $votationId) {
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
        response.getVotationResults.alternatives.map((a: Alternative) => {
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
    expect(response.getVotationResults.votingEligibleCount).toEqual(3);
    expect(response.getVotationResults.voteCount).toEqual(3);
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
                getVotationResults(votationId: $votationId) {
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
        response.getVotationResults.alternatives.map((a: Alternative) => {
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
    expect(response.getVotationResults.votingEligibleCount).toEqual(3);
    expect(response.getVotationResults.voteCount).toEqual(3);
});

it('should return not authorised trying to get votation results', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.PARTICIPANT, true);
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
    await vote(ctx, votation.id, ctx.userId, alternative1.id);
    await setWinner(ctx, votation.id);
    try {
        await ctx.client.request(
            gql`
                query GetVotationResults($votationId: String!) {
                    getVotationResults(votationId: $votationId) {
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
