import { Role } from '.prisma/client';
import { createTestContext } from '../../../lib/tests/testContext';
import { createMeeting, createUser } from '../../../lib/tests/utils';
import { gql } from 'graphql-request';
const ctx = createTestContext();

it('should register participant successfully', async () => {
    const owner = await createUser(ctx);
    const meeting = await createMeeting(ctx, owner.id, Role.ADMIN, true, true);
    const response = await ctx.client.request(
        gql`
            mutation RegisterAsParticipant($meetingId: String!) {
                registerAsParticipant(meetingId: $meetingId) {
                    role
                    isVotingEligible
                }
            }
        `,
        {
            meetingId: meeting.id,
        }
    );
    expect(response.registerAsParticipant.role).toBe(Role.PARTICIPANT);
});

it('should return participant when registering as participant for a meeting where you are already a participant', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.ADMIN, true, true);
    const response = await ctx.client.request(
        gql`
            mutation RegisterAsParticipant($meetingId: String!) {
                registerAsParticipant(meetingId: $meetingId) {
                    role
                    isVotingEligible
                }
            }
        `,
        {
            meetingId: meeting.id,
        }
    );
    expect(response.registerAsParticipant.role).toBe(Role.ADMIN);
});

it('should return not Authorised trying to register as participant at meeting that does not allow selfregistration', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.COUNTER, true, false);
    try {
        await ctx.client.request(
            gql`
                mutation RegisterAsParticipant($meetingId: String!) {
                    registerAsParticipant(meetingId: $meetingId) {
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
