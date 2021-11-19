import { createMeeting, createVotation, createParticipant, createUser, createReview } from '../../../lib/tests/utils';
import { createTestContext } from '../../../lib/tests/testContext';
import { VotationStatus, Role } from '.prisma/client';
import { gql } from 'graphql-request';
const ctx = createTestContext();

it('should return my review', async () => {
    const user = await createUser(ctx);
    const meeting = await createMeeting(ctx, user.id, Role.ADMIN, true);
    const votation = await createVotation(ctx, meeting.id, VotationStatus.CHECKING_RESULT, 0);
    const participant = await createParticipant(ctx, meeting.id, ctx.userId, true, Role.COUNTER);
    await createReview(ctx, votation.id, participant.id, true);
    const response = await ctx.client.request(
        gql`
            query getMyReview($votationId: String!) {
                getMyReview(votationId: $votationId) {
                    __typename
                    ... on VotationReview {
                        approved
                    }
                    ... on NoReview {
                        message
                    }
                }
            }
        `,
        {
            votationId: votation.id,
        }
    );
    expect(response.getMyReview).toEqual({ __typename: 'VotationReview', approved: true });
});

it('should return no review', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.ADMIN, true);
    const votation = await createVotation(ctx, meeting.id, VotationStatus.CHECKING_RESULT, 0);
    const response = await ctx.client.request(
        gql`
            query getMyReview($votationId: String!) {
                getMyReview(votationId: $votationId) {
                    __typename
                    ... on VotationReview {
                        approved
                    }
                    ... on NoReview {
                        message
                    }
                }
            }
        `,
        {
            votationId: votation.id,
        }
    );
    expect(response.getMyReview.__typename).toEqual('NoReview');
});
