import { createMeeting, createVotation, createParticipant, createUser, createReview } from '../../../lib/tests/utils';
import { createTestContext } from '../../../lib/tests/testContext';
import { VotationStatus, Role } from '.prisma/client';
import { gql } from 'graphql-request';
const ctx = createTestContext();

it('should return reviews of votation', async () => {
    const user = await createUser(ctx);
    const meeting = await createMeeting(ctx, user.id, Role.ADMIN, true);
    const votation = await createVotation(ctx, meeting.id, VotationStatus.CHECKING_RESULT, 0);
    const participant = await createParticipant(ctx, meeting.id, ctx.userId, true, Role.ADMIN);
    await createReview(ctx, votation.id, participant.id, true);
    const response = await ctx.client.request(
        gql`
            query getReviews($votationId: String!) {
                getReviews(votationId: $votationId) {
                    approved
                    disapproved
                }
            }
        `,
        {
            votationId: votation.id,
        }
    );
    expect(response.getReviews).toEqual({ approved: 1, disapproved: 0 });
});

it('should return not authorised trying to get reviews as counter', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.COUNTER, true);
    const votation = await createVotation(ctx, meeting.id, VotationStatus.CHECKING_RESULT, 0);
    try {
        await ctx.client.request(
            gql`
                query getReviews($votationId: String!) {
                    getReviews(votationId: $votationId) {
                        approved
                        disapproved
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
