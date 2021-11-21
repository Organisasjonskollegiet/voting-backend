import { createMeeting, createUser, createVotation } from '../../../lib/tests/utils';
import { createTestContext } from '../../../lib/tests/testContext';
import { VotationStatus, Role } from '.prisma/client';
import { gql } from 'graphql-request';
const ctx = createTestContext();

it('should return 2 as number of upcoming votations as participant', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.COUNTER, true);
    await createVotation(ctx, meeting.id, VotationStatus.UPCOMING, 1);
    await createVotation(ctx, meeting.id, VotationStatus.UPCOMING, 2);
    await createVotation(ctx, meeting.id, VotationStatus.OPEN, 3);
    const response = await ctx.client.request(
        gql`
            query GetNumberOfUpcomingVotations($meetingId: String!) {
                numberOfUpcomingVotations(meetingId: $meetingId)
            }
        `,
        {
            meetingId: meeting.id,
        }
    );
    expect(response.numberOfUpcomingVotations).toBe(2);
});

it('should return Not Authorised trying to get number of upcoming votations without being participant', async () => {
    const user = await createUser(ctx);
    const meeting = await createMeeting(ctx, user.id, Role.ADMIN, true);
    await createVotation(ctx, meeting.id, VotationStatus.UPCOMING, 1);
    try {
        await ctx.client.request(
            gql`
                query GetNumberOfUpcomingVotations($meetingId: String!) {
                    numberOfUpcomingVotations(meetingId: $meetingId)
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
