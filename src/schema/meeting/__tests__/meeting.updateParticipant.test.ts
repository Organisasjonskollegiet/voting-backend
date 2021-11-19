import { Role } from '.prisma/client';
import { createTestContext } from '../../../lib/tests/testContext';
import { createMeeting, createUser, createParticipant } from '../../../lib/tests/utils';
import casual from 'casual';
import { gql } from 'graphql-request';
const ctx = createTestContext();

it('should update participant successfully', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.ADMIN, true);
    const user = await createUser(ctx);
    await createParticipant(ctx, meeting.id, user.id, true, Role.PARTICIPANT);
    const participantInput = {
        email: user.email,
        role: Role.COUNTER,
        isVotingEligible: false,
    };
    const response = await ctx.client.request(
        gql`
            mutation UpdateParticipant($meetingId: String!, $participant: ParticipantInput!) {
                updateParticipant(meetingId: $meetingId, participant: $participant) {
                    email
                    role
                    isVotingEligible
                }
            }
        `,
        {
            meetingId: meeting.id,
            participant: participantInput,
        }
    );
    expect(response.updateParticipant).toEqual(participantInput);
});

it('should update invite successfully', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.ADMIN, true);
    const email = casual.email;
    await ctx.prisma.invite.create({
        data: {
            meetingId: meeting.id,
            email,
            isVotingEligible: true,
            role: Role.PARTICIPANT,
        },
    });
    const inviteInput = {
        email,
        role: Role.COUNTER,
        isVotingEligible: false,
    };
    const response = await ctx.client.request(
        gql`
            mutation UpdateParticipant($meetingId: String!, $participant: ParticipantInput!) {
                updateParticipant(meetingId: $meetingId, participant: $participant) {
                    email
                    role
                    isVotingEligible
                }
            }
        `,
        {
            meetingId: meeting.id,
            participant: inviteInput,
        }
    );
    expect(response.updateParticipant).toEqual(inviteInput);
});

it('should return Not authorised trying to update participant', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.COUNTER, true);
    const user = await createUser(ctx);
    await createParticipant(ctx, meeting.id, user.id, true, Role.PARTICIPANT);
    const participantInput = {
        email: user.email,
        role: Role.COUNTER,
        isVotingEligible: false,
    };
    try {
        await ctx.client.request(
            gql`
                mutation UpdateParticipant($meetingId: String!, $participant: ParticipantInput!) {
                    updateParticipant(meetingId: $meetingId, participant: $participant) {
                        email
                        role
                        isVotingEligible
                    }
                }
            `,
            {
                meetingId: meeting.id,
                participant: participantInput,
            }
        );
        expect(false).toBeTruthy();
    } catch (error: any) {
        expect(error.message).toContain('Not Authorised!');
    }
});
