import { createMeeting, createVotation, staticVotationData } from '../../../lib/tests/utils';
import { createTestContext } from '../../../lib/tests/testContext';
import { VotationStatus, VotationType, Role } from '.prisma/client';
import { gql } from 'graphql-request';
const ctx = createTestContext();

it('should return votation by id', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.COUNTER, true);
    const votation = await createVotation(ctx, meeting.id, VotationStatus.UPCOMING, 1);
    const votationId = votation.id;
    const getVotation = await ctx.client.request(
        gql`
            query GetVotationById($votationId: String!) {
                votationById(votationId: $votationId) {
                    id
                    title
                    description
                    blankVotes
                    hiddenVotes
                    type
                    numberOfWinners
                    majorityThreshold
                    meetingId
                }
            }
        `,
        {
            votationId,
        }
    );
    expect(getVotation.votationById).toEqual({
        id: votationId,
        ...staticVotationData,
        type: VotationType.SIMPLE,
        majorityThreshold: 66,
        meetingId: meeting.id,
        blankVotes: false,
    });
});

it('should throw error from votation by id', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.COUNTER, true);
    await createVotation(ctx, meeting.id, VotationStatus.UPCOMING, 1);
    try {
        await ctx.client.request(
            gql`
                query GetVotationById($votationId: String!) {
                    votationById(votationId: $votationId) {
                        id
                        title
                        description
                        blankVotes
                        type
                        numberOfWinners
                        majorityThreshold
                        meetingId
                    }
                }
            `,
            {
                votationId: '1',
            }
        );
        expect(false).toBeTruthy();
    } catch (error: any) {
        expect(error.message).toContain('Not Authorised!');
    }
});
