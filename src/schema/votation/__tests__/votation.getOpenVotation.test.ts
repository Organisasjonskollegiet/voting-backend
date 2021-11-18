import { createMeeting, createVotation, createUser } from '../../../lib/tests/utils';
import { createTestContext } from '../../../lib/tests/testContext';
import { VotationStatus, Role } from '.prisma/client';
import { gql } from 'graphql-request';
const ctx = createTestContext();

it('should return id of open votation', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.ADMIN, true);
    const openVotation = await createVotation(ctx, meeting.id, VotationStatus.OPEN, 1);
    await createVotation(ctx, meeting.id, VotationStatus.PUBLISHED_RESULT, 2);
    const response = await ctx.client.request(
        gql`
            query GetOpenVotation($meetingId: String!) {
                getOpenVotation(meetingId: $meetingId)
            }
        `,
        {
            meetingId: meeting.id,
        }
    );
    expect(response.getOpenVotation).toBe(openVotation.id);
});

it('should return id of open votation', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.ADMIN, true);
    const closedVotation = await createVotation(ctx, meeting.id, VotationStatus.PUBLISHED_RESULT, 2);
    const response = await ctx.client.request(
        gql`
            query GetOpenVotation($meetingId: String!) {
                getOpenVotation(meetingId: $meetingId)
            }
        `,
        {
            meetingId: meeting.id,
        }
    );
    expect(response.getOpenVotation).toBe('');
});

it('should Not Authorised trying to get open votation', async () => {
    const otherUser = await createUser(ctx);
    const meeting = await createMeeting(ctx, otherUser.id, Role.ADMIN, true);
    await createVotation(ctx, meeting.id, VotationStatus.PUBLISHED_RESULT, 2);
    try {
        await ctx.client.request(
            gql`
                query GetOpenVotation($meetingId: String!) {
                    getOpenVotation(meetingId: $meetingId)
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
