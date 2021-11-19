import { Role } from '.prisma/client';
import { createTestContext } from '../../../lib/tests/testContext';
import { createMeeting, createUser, createParticipant } from '../../../lib/tests/utils';
import casual from 'casual';
import { gql } from 'graphql-request';
const ctx = createTestContext();

it('should return correct participants and invitations', async () => {
    const ctxUserRole = Role.ADMIN;
    const meeting = await createMeeting(ctx, ctx.userId, ctxUserRole, true);
    const ctxUser = await ctx.prisma.user.findUnique({
        where: {
            id: ctx.userId,
        },
    });
    if (!ctxUser) throw new Error();
    const user1 = await createUser(ctx);
    const participant1 = await createParticipant(ctx, meeting.id, user1.id, true, Role.PARTICIPANT);
    const invite = await ctx.prisma.invite.create({
        data: {
            meetingId: meeting.id,
            email: casual.email,
            role: Role.COUNTER,
            isVotingEligible: true,
        },
    });
    const response = await ctx.client.request(
        gql`
            query GetParticipants($meetingId: String!) {
                participants(meetingId: $meetingId) {
                    email
                    role
                    isVotingEligible
                }
            }
        `,
        {
            meetingId: meeting.id,
        }
    );
    const participants = response.participants;
    expect(participants).toEqual(
        expect.arrayContaining([
            {
                email: user1.email,
                role: participant1.role,
                isVotingEligible: participant1.isVotingEligible,
            },
            {
                email: ctxUser.email,
                role: ctxUserRole,
                isVotingEligible: true,
            },
            {
                email: invite.email,
                role: invite.role,
                isVotingEligible: invite.isVotingEligible,
            },
        ])
    );
});

it('should return not Authorised trying to get participants as counter', async () => {
    const ctxUserRole = Role.COUNTER;
    const meeting = await createMeeting(ctx, ctx.userId, ctxUserRole, true);
    try {
        await ctx.client.request(
            gql`
                query GetParticipants($meetingId: String!) {
                    participants(meetingId: $meetingId) {
                        email
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
