import {
    createMeeting,
    createVotation,
    createAlternative,
    createUser,
    createParticipant,
    vote,
} from '../../../lib/tests/utils';
import { createTestContext } from '../../../lib/tests/testContext';
import { VotationStatus, Role } from '.prisma/client';
import { gql } from 'graphql-request';
const ctx = createTestContext();

const alternativeText = 'alt';

it('should return correct vote count', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.ADMIN, true);
    const user1 = await createUser(ctx);
    const user2 = await createUser(ctx);
    await createParticipant(ctx, meeting.id, user1.id, true, Role.PARTICIPANT);
    await createParticipant(ctx, meeting.id, user2.id, false, Role.PARTICIPANT);
    const votation1 = await createVotation(ctx, meeting.id, VotationStatus.OPEN, 1);
    const votation2 = await createVotation(ctx, meeting.id, VotationStatus.OPEN, 1);
    const alternativeForVotation1 = await createAlternative(ctx, votation1.id, alternativeText);
    const alternativeForVotation2 = await createAlternative(ctx, votation2.id, alternativeText);
    await vote(ctx, votation1.id, ctx.userId, alternativeForVotation1.id);
    await vote(ctx, votation1.id, user1.id, alternativeForVotation1.id);
    await vote(ctx, votation2.id, user1.id, alternativeForVotation2.id);
    const voteCount = await ctx.client.request(
        gql`
            query GetVoteCount($votationId: String!) {
                getVoteCount(votationId: $votationId) {
                    votingEligibleCount
                    voteCount
                }
            }
        `,
        {
            votationId: votation1.id,
        }
    );
    expect(voteCount.getVoteCount.votingEligibleCount).toEqual(2);
    expect(voteCount.getVoteCount.voteCount).toEqual(2);
});

it('should return not authorised trying to get vote count if not participant', async () => {
    const user1 = await createUser(ctx);
    const meeting = await createMeeting(ctx, user1.id, Role.ADMIN, false);
    const votation = await createVotation(ctx, meeting.id, VotationStatus.OPEN, 1);
    const alternative = await createAlternative(ctx, votation.id, alternativeText);
    await vote(ctx, votation.id, user1.id, alternative.id);
    try {
        await ctx.client.request(
            gql`
                query GetVoteCount($votationId: String!) {
                    getVoteCount(votationId: $votationId) {
                        votingEligibleCount
                        voteCount
                    }
                }
            `,
            {
                votationId: votation.id,
            }
        );
        expect(true).toBeFalsy();
    } catch (error: any) {
        expect(error.message).toContain('Not Authorised!');
    }
});
