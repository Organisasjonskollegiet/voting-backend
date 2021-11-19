import { Role } from '.prisma/client';
import { createTestContext } from '../../../lib/tests/testContext';
import { createMeeting, createUser } from '../../../lib/tests/utils';
import { gql } from 'graphql-request';
const ctx = createTestContext();

it('should return the logged in participant', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.ADMIN, true);
    const response = await ctx.client.request(
        gql`
            query GetParticipant($meetingId: String!) {
                myParticipant(meetingId: $meetingId) {
                    role
                    isVotingEligible
                }
            }
        `,
        {
            meetingId: meeting.id,
        }
    );
    expect(response.myParticipant.role).toBe(Role.ADMIN);
    expect(response.myParticipant.isVotingEligible).toBe(true);
});

it('should not authorised trying to get my participant if user is not participant', async () => {
    const user = await createUser(ctx);
    const meeting = await createMeeting(ctx, user.id, Role.ADMIN, true);
    try {
        await ctx.client.request(
            gql`
                query GetParticipant($meetingId: String!) {
                    myParticipant(meetingId: $meetingId) {
                        role
                        isVotingEligible
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
