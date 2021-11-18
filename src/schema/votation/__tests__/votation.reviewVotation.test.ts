import { createMeeting, createVotation, createParticipant, createUser } from '../../../lib/tests/utils';
import { createTestContext } from '../../../lib/tests/testContext';
import { VotationStatus, Role } from '.prisma/client';
import { gql } from 'graphql-request';
const ctx = createTestContext();

it('should create a review of a votation', async () => {
    const user = await createUser(ctx);
    const meeting = await createMeeting(ctx, user.id, Role.ADMIN, true);
    const participant = await createParticipant(ctx, meeting.id, ctx.userId, true, Role.COUNTER);
    const votation = await createVotation(ctx, meeting.id, VotationStatus.CHECKING_RESULT, 0);
    const response = await ctx.client.request(
        gql`
            mutation ReviewVotation($votationId: String!, $approved: Boolean!) {
                reviewVotation(votationId: $votationId, approved: $approved)
            }
        `,
        {
            votationId: votation.id,
            approved: true,
        }
    );
    expect(response.reviewVotation).toBe('Votering godkjent.');
    const review = await ctx.prisma.votationResultReview.findUnique({
        where: {
            votationId_participantId: {
                votationId: votation.id,
                participantId: participant.id,
            },
        },
    });
    expect(review?.approved).toBeTruthy();
});

it('should return not authorised trying to review a votation', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.PARTICIPANT, true);
    const votation = await createVotation(ctx, meeting.id, VotationStatus.CHECKING_RESULT, 0);
    try {
        await ctx.client.request(
            gql`
                mutation ReviewVotation($votationId: String!, $approved: Boolean!) {
                    reviewVotation(votationId: $votationId, approved: $approved)
                }
            `,
            {
                votationId: votation.id,
                approved: true,
            }
        );
        expect(false).toBeTruthy();
    } catch (error: any) {
        expect(error.message).toContain('Not Authorised!');
    }
});

it('should update a review of a votation', async () => {
    const user = await createUser(ctx);
    const meeting = await createMeeting(ctx, user.id, Role.ADMIN, true);
    const participant = await createParticipant(ctx, meeting.id, ctx.userId, true, Role.COUNTER);
    const votation = await createVotation(ctx, meeting.id, VotationStatus.CHECKING_RESULT, 0);
    await ctx.prisma.votationResultReview.create({
        data: {
            votationId: votation.id,
            participantId: participant.id,
            approved: true,
        },
    });
    const response = await ctx.client.request(
        gql`
            mutation ReviewVotation($votationId: String!, $approved: Boolean!) {
                reviewVotation(votationId: $votationId, approved: $approved)
            }
        `,
        {
            votationId: votation.id,
            approved: false,
        }
    );
    expect(response.reviewVotation).toBe('Votering ikke godkjent.');
    const updatedReview = await ctx.prisma.votationResultReview.findUnique({
        where: {
            votationId_participantId: {
                votationId: votation.id,
                participantId: participant.id,
            },
        },
    });
    expect(updatedReview?.approved).toBeFalsy();
});
