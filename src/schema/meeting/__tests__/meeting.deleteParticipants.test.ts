import { Role } from '.prisma/client';
import { createTestContext } from '../../../lib/tests/testContext';
import { createMeeting, createUser, createParticipant } from '../../../lib/tests/utils';
import casual from 'casual';
import { gql } from 'graphql-request';
const ctx = createTestContext();

it('should delete participant successfully', async () => {
    const otherUser = await createUser(ctx);
    const meeting = await createMeeting(ctx, ctx.userId, Role.ADMIN, true);
    const invite = await ctx.prisma.invite.create({
        data: {
            email: casual.email,
            isVotingEligible: true,
            meetingId: meeting.id,
            role: Role.ADMIN,
        },
    });
    await createParticipant(ctx, meeting.id, otherUser.id, true, Role.ADMIN);
    const deleteParticipants = await ctx.client.request(
        gql`
            mutation DeleteParticipant($meetingId: String!, $emails: [String!]!) {
                deleteParticipants(meetingId: $meetingId, emails: $emails)
            }
        `,
        {
            meetingId: meeting.id,
            emails: [invite.email, otherUser.email],
        }
    );
    expect(deleteParticipants.deleteParticipants.includes(invite.email)).toBeTruthy();
    expect(deleteParticipants.deleteParticipants.includes(otherUser.email)).toBeTruthy();
});

it('should return OwnerCannotBeRemovedFromParticipantError', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.ADMIN, true);
    const user = await ctx.prisma.user.findUnique({
        where: {
            id: ctx.userId,
        },
    });
    const deleteParticipants = await ctx.client.request(
        gql`
            mutation DeleteParticipant($meetingId: String!, $emails: [String!]!) {
                deleteParticipants(meetingId: $meetingId, emails: $emails)
            }
        `,
        {
            meetingId: meeting.id,
            emails: [user?.email],
        }
    );
    expect(deleteParticipants.deleteParticipants).toEqual([]);
    const participantCount = await ctx.prisma.participant.count({
        where: {
            userId: ctx.userId,
            meetingId: meeting.id,
        },
    });
    expect(participantCount).toBe(1);
});

it('should return Not Authorised when deleting participant', async () => {
    const user = await ctx.prisma.user.findUnique({
        where: {
            id: ctx.userId,
        },
    });
    const otherUser = await createUser(ctx);
    const meeting = await createMeeting(ctx, otherUser.id, Role.ADMIN, true);
    await createParticipant(ctx, meeting.id, user!.id, true, Role.COUNTER);
    try {
        await ctx.client.request(
            gql`
                mutation DeleteParticipant($meetingId: String!, $emails: [String!]!) {
                    deleteParticipants(meetingId: $meetingId, emails: $emails)
                }
            `,
            {
                meetingId: meeting.id,
                emails: [user!.email],
            }
        );
        expect(false).toBeTruthy();
    } catch (error: any) {
        expect(error.message).toContain('Not Authorised!');
    }
    const participantCount = await ctx.prisma.participant.count({
        where: {
            userId: ctx.userId,
            meetingId: meeting.id,
        },
    });
    expect(participantCount).toBe(1);
});
