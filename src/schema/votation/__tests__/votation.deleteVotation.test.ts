import { createMeeting, createVotation, createAlternative, staticMeetingData } from '../../../lib/tests/utils';
import { createTestContext } from '../../../lib/tests/testContext';
import { VotationStatus, Role } from '.prisma/client';
import { gql } from 'graphql-request';
const ctx = createTestContext();

it('should delete votation successfully', async () => {
    const meetingOwnerId = ctx.userId;
    const meeting = await ctx.prisma.meeting.create({
        data: {
            ...staticMeetingData,
            ownerId: meetingOwnerId,
            participants: {
                create: {
                    userId: ctx.userId,
                    role: Role.ADMIN,
                    isVotingEligible: true,
                },
            },
        },
    });
    const votation1 = await createVotation(ctx, meeting.id, VotationStatus.UPCOMING, 1);
    const votation2 = await createVotation(ctx, meeting.id, VotationStatus.UPCOMING, 2);
    await createAlternative(ctx, votation1.id, 'alternative');
    await ctx.client.request(
        gql`
            mutation DeleteVotation($votationId: String!) {
                deleteVotation(votationId: $votationId)
            }
        `,
        {
            votationId: votation1.id,
        }
    );
    const numberOfVotationsWithId1 = await ctx.prisma.votation.count({ where: { id: votation1.id } });
    const numberOfVotationsWithId2 = await ctx.prisma.votation.count({ where: { id: votation2.id } });
    expect(numberOfVotationsWithId1).toBe(0);
    expect(numberOfVotationsWithId2).toBe(1);
});

it('should not delete votation successfully', async () => {
    const text = 'alt';
    const meeting = await createMeeting(ctx, ctx.userId, Role.COUNTER, true);
    const votation = await createVotation(ctx, meeting.id, VotationStatus.UPCOMING, 1);
    await createAlternative(ctx, votation.id, text);
    try {
        await ctx.client.request(
            gql`
                mutation DeleteVotation($votationId: String!) {
                    deleteVotation(votationId: $votationId)
                }
            `,
            {
                votationId: votation.id,
            }
        );
        expect(false).toBeTruthy();
    } catch (error: any) {
        expect(error.message).toContain('Not Authorised!');
    }
});
