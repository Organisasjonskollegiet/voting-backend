import { Role } from '.prisma/client';
import { createTestContext } from '../../../lib/tests/testContext';
import { createMeeting, createUser, staticMeetingData } from '../../../lib/tests/utils';
import { gql } from 'graphql-request';
const ctx = createTestContext();

it('should return a meeting by id successfully', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.ADMIN, true);
    const getMeeting = await ctx.client.request(
        gql`
            query GetMeetingById($meetingId: String!) {
                meetingById(meetingId: $meetingId) {
                    id
                    title
                    organization
                    description
                    startTime
                    status
                    owner {
                        id
                    }
                }
            }
        `,
        {
            meetingId: meeting.id,
        }
    );
    const meetingResult = getMeeting.meetingById;
    expect(meetingResult).toEqual({
        id: meeting.id,
        title: meeting.title,
        organization: meeting.organization,
        startTime: staticMeetingData.startTime,
        status: meeting.status,
        description: meeting.description,
        owner: {
            id: meeting.ownerId,
        },
    });
});

it('should return Not Authorised trying to get a meeting by id where you are not participating', async () => {
    const otherUser = await createUser(ctx);
    const meeting = await createMeeting(ctx, otherUser.id, Role.ADMIN, true);
    try {
        await ctx.client.request(
            gql`
                query GetMeetingById($meetingId: String!) {
                    meetingById(meetingId: $meetingId) {
                        id
                        title
                        organization
                        description
                        startTime
                        status
                        owner {
                            id
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
