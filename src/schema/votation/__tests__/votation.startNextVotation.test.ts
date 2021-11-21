import { createAlternative, createMeeting, createVotation } from '../../../lib/tests/utils';
import { createTestContext } from '../../../lib/tests/testContext';
import { VotationStatus, Role } from '.prisma/client';
import { gql } from 'graphql-request';
const ctx = createTestContext();

it('should start next votation successfully', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.ADMIN, true);
    const nextVotation = await createVotation(ctx, meeting.id, VotationStatus.UPCOMING, 1);
    await createVotation(ctx, meeting.id, VotationStatus.UPCOMING, 2);
    await createAlternative(ctx, nextVotation.id, 'Alt');
    await createVotation(ctx, meeting.id, VotationStatus.PUBLISHED_RESULT, 0);
    const response = await ctx.client.request(
        gql`
            mutation StartNextVotation($meetingId: String!) {
                startNextVotation(meetingId: $meetingId) {
                    __typename
                    ... on MaxOneOpenVotationError {
                        message
                    }
                    ... on NoUpcomingVotations {
                        message
                    }
                    ... on VotationHasNoAlternatives {
                        message
                    }
                    ... on OpenedVotation {
                        votationId
                    }
                }
            }
        `,
        {
            meetingId: meeting.id,
        }
    );
    expect(response.startNextVotation.votationId).toEqual(nextVotation.id);
});

it('should return not authorised trying to start next votation as COUNTER', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.COUNTER, true);
    await createVotation(ctx, meeting.id, VotationStatus.UPCOMING, 1);
    try {
        await ctx.client.request(
            gql`
                mutation StartNextVotation($meetingId: String!) {
                    startNextVotation(meetingId: $meetingId) {
                        __typename
                        ... on MaxOneOpenVotationError {
                            message
                        }
                        ... on NoUpcomingVotations {
                            message
                        }
                        ... on VotationHasNoAlternatives {
                            message
                        }
                        ... on OpenedVotation {
                            votationId
                        }
                    }
                }
            `,
            {
                meetingId: meeting.id,
            }
        );
        expect(false).toBeTruthy();
    } catch (error: any) {
        expect(error.message).toContain('Not Authorised!');
    }
});
