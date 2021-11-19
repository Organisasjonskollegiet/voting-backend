import { createMeeting, createVotation } from '../../../lib/tests/utils';
import { createTestContext } from '../../../lib/tests/testContext';
import { VotationStatus, Role } from '.prisma/client';
import { gql } from 'graphql-request';
const ctx = createTestContext();

it('should update votation status successfully', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.ADMIN, true);
    const votation = await createVotation(ctx, meeting.id, VotationStatus.UPCOMING, 1);
    const newStatus = VotationStatus.OPEN;
    const updateVotationStatus = await ctx.client.request(
        gql`
            mutation UpdateVotationStatus($votationId: String!, $status: VotationStatus!) {
                updateVotationStatus(votationId: $votationId, status: $status) {
                    __typename
                    ... on Votation {
                        id
                        status
                    }
                    ... on MaxOneOpenVotationError {
                        message
                    }
                }
            }
        `,
        {
            votationId: votation.id,
            status: newStatus,
        }
    );
    expect(updateVotationStatus.updateVotationStatus.__typename).toBe('Votation');
    expect(updateVotationStatus.updateVotationStatus.status).toBe(newStatus);
});

it('should return MaxOneOpenVotationStatus trying to open votation', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.ADMIN, true);
    await createVotation(ctx, meeting.id, VotationStatus.OPEN, 1);
    const votation = await createVotation(ctx, meeting.id, VotationStatus.UPCOMING, 2);
    const updateVotationStatus = await ctx.client.request(
        gql`
            mutation UpdateVotationStatus($votationId: String!, $status: VotationStatus!) {
                updateVotationStatus(votationId: $votationId, status: $status) {
                    __typename
                    ... on Votation {
                        id
                        status
                    }
                    ... on MaxOneOpenVotationError {
                        message
                    }
                }
            }
        `,
        {
            votationId: votation.id,
            status: VotationStatus.OPEN,
        }
    );
    expect(updateVotationStatus.updateVotationStatus.__typename).toBe('MaxOneOpenVotationError');
});

it('should return Not Authorised trying to update votation status as Counter', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.COUNTER, true);
    const votation = await createVotation(ctx, meeting.id, VotationStatus.UPCOMING, 1);
    const newStatus = VotationStatus.OPEN;
    try {
        await ctx.client.request(
            gql`
                mutation UpdateVotationStatus($votationId: String!, $status: VotationStatus!) {
                    updateVotationStatus(votationId: $votationId, status: $status) {
                        __typename
                        ... on Votation {
                            id
                            status
                        }
                        ... on MaxOneOpenVotationError {
                            message
                        }
                    }
                }
            `,
            {
                votationId: votation.id,
                status: newStatus,
            }
        );
        expect(false).toBeTruthy();
    } catch (error: any) {
        expect(error.message).toContain('Not Authorised!');
    }
});
