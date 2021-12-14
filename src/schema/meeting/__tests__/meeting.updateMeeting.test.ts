import { Role } from '.prisma/client';
import { createTestContext } from '../../../lib/tests/testContext';
import { createMeeting, updatedMeetingData } from '../../../lib/tests/utils';
import { gql } from 'graphql-request';
const ctx = createTestContext();

it('should update meeting successfully', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.ADMIN, true);
    const updatedMeeting = await ctx.client.request(
        gql`
            mutation UpdateMeeting($meeting: UpdateMeetingInput!) {
                updateMeeting(meeting: $meeting) {
                    id
                    title
                    organization
                    description
                    startTime
                    status
                    allowSelfRegistration
                }
            }
        `,
        {
            meeting: {
                id: meeting.id,
                ...updatedMeetingData,
            },
        }
    );
    expect(updatedMeeting.updateMeeting).toEqual({
        id: meeting.id,
        ...updatedMeetingData,
    });
});

it('should throw error for not authorized when trying to update meeting', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.COUNTER, true);
    try {
        await ctx.client.request(
            gql`
                mutation UpdateMeeting($meeting: UpdateMeetingInput!) {
                    updateMeeting(meeting: $meeting) {
                        id
                        title
                        description
                        startTime
                        status
                        allowSelfRegistration
                    }
                }
            `,
            {
                meeting: {
                    id: meeting.id,
                    ...updatedMeetingData,
                },
            }
        );
        expect(false).toBeTruthy();
    } catch (error: any) {
        expect(error.message).toContain('Not Authorised!');
    }
});
