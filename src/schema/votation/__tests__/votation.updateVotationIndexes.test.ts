import { createMeeting, createVotation } from '../../../lib/tests/utils';
import { createTestContext } from '../../../lib/tests/testContext';
import { VotationStatus, Role } from '.prisma/client';
import { gql } from 'graphql-request';
const ctx = createTestContext();

it('should update index successfully', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.ADMIN, true);
    const votation1 = await createVotation(ctx, meeting.id, VotationStatus.UPCOMING, 1);
    const votation2 = await createVotation(ctx, meeting.id, VotationStatus.UPCOMING, 2);
    const response = await ctx.client.request(
        gql`
            mutation UpdateVotationIndexes($votations: [UpdateVotationIndexInput!]!, $meetingId: String!) {
                updateVotationIndexes(votations: $votations, meetingId: $meetingId) {
                    id
                    index
                }
            }
        `,
        {
            meetingId: meeting.id,
            votations: [
                {
                    id: votation1.id,
                    index: 2,
                },
                {
                    id: votation2.id,
                    index: 1,
                },
            ],
        }
    );
    expect(response.updateVotationIndexes.find((v: { id: string; index: number }) => v.id === votation1.id).index).toBe(
        2
    );
    expect(response.updateVotationIndexes.find((v: { id: string; index: number }) => v.id === votation2.id).index).toBe(
        1
    );
});

it('should return error trying to update index of open votation', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.ADMIN, true);
    const votation1 = await createVotation(ctx, meeting.id, VotationStatus.OPEN, 1);
    try {
        await ctx.client.request(
            gql`
                mutation UpdateVotationIndexes($votations: [UpdateVotationIndexInput!]!, $meetingId: String!) {
                    updateVotationIndexes(votations: $votations, meetingId: $meetingId) {
                        id
                        index
                    }
                }
            `,
            {
                meetingId: meeting.id,
                votations: [
                    {
                        id: votation1.id,
                        index: 2,
                    },
                ],
            }
        );
        expect(false).toBeTruthy();
    } catch (error) {
        expect(true).toBeTruthy();
    }
});

it('should return error trying to update index of open votation', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.COUNTER, true);
    const votation1 = await createVotation(ctx, meeting.id, VotationStatus.UPCOMING, 1);
    try {
        await ctx.client.request(
            gql`
                mutation UpdateVotationIndexes($votations: [UpdateVotationIndexInput!]!, $meetingId: String!) {
                    updateVotationIndexes(votations: $votations, meetingId: $meetingId) {
                        id
                        index
                    }
                }
            `,
            {
                meetingId: meeting.id,
                votations: [
                    {
                        id: votation1.id,
                        index: 2,
                    },
                ],
            }
        );
        expect(false).toBeTruthy();
    } catch (error: any) {
        expect(error.message).toContain('Not Authorised!');
    }
});
