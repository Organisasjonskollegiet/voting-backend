import { Role } from '.prisma/client';
import { createTestContext } from '../../../lib/tests/testContext';
import { createMeeting, createUser } from '../../../lib/tests/utils';
import casual from 'casual';
import { gql } from 'graphql-request';
const ctx = createTestContext();

it('should add participant and invite successfully', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.ADMIN, true);
    const user = await createUser(ctx);
    const participantRole = 'ADMIN';
    const inviteEmail = casual.email;
    const inviteRole = 'COUNTER';
    await ctx.client.request(
        gql`
            mutation AddParticipants($meetingId: String!, $participants: [ParticipantInput!]!) {
                addParticipants(meetingId: $meetingId, participants: $participants)
            }
        `,
        {
            meetingId: meeting.id,
            participants: [
                {
                    email: user.email,
                    role: participantRole,
                    isVotingEligible: true,
                },
                {
                    email: inviteEmail,
                    role: inviteRole,
                    isVotingEligible: false,
                },
            ],
        }
    );
    const newParticipant = await ctx.prisma.participant.findUnique({
        where: {
            userId_meetingId: {
                userId: user.id,
                meetingId: meeting.id,
            },
        },
    });
    const invite = await ctx.prisma.invite.findUnique({
        where: {
            email_meetingId: {
                email: inviteEmail,
                meetingId: meeting.id,
            },
        },
    });
    expect(newParticipant?.role).toBe(participantRole);
    expect(invite?.role).toBe(inviteRole);
});

it('should return not Authorised trying to add participant and invite ', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.COUNTER, true);
    const user = await createUser(ctx);
    const participantRole = 'ADMIN';
    const inviteEmail = '2@mail.com';
    const inviteRole = 'COUNTER';
    try {
        await ctx.client.request(
            gql`
                mutation AddParticipants($meetingId: String!, $participants: [ParticipantInput!]!) {
                    addParticipants(meetingId: $meetingId, participants: $participants)
                }
            `,
            {
                meetingId: meeting.id,
                participants: [
                    {
                        email: user.email,
                        role: participantRole,
                        isVotingEligible: true,
                    },
                    {
                        email: inviteEmail,
                        role: inviteRole,
                        isVotingEligible: true,
                    },
                ],
            }
        );
        expect(false).toBeTruthy();
    } catch (error: any) {
        expect(error.message).toContain('Not Authorised!');
    }
});
