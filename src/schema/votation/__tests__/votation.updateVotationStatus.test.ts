import { createMeeting, createVotation } from '../../../lib/tests/utils';
import { createTestContext } from '../../../lib/tests/testContext';
import { VotationStatus, Role } from '.prisma/client';
import { gql } from 'graphql-request';
import { checkIfValidStatusUpdate } from '..';
const ctx = createTestContext();

it('should update votation status successfully', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.ADMIN, true);
    const votation = await createVotation(ctx, meeting.id, VotationStatus.CHECKING_RESULT, 1);
    const newStatus = VotationStatus.PUBLISHED_RESULT;
    const updateVotationStatus = await ctx.client.request(
        gql`
            mutation UpdateVotationStatus($votationId: String!, $status: VotationStatus!) {
                updateVotationStatus(votationId: $votationId, status: $status) {
                    id
                    status
                }
            }
        `,
        {
            votationId: votation.id,
            status: newStatus,
        }
    );
    expect(updateVotationStatus.updateVotationStatus.status).toBe(newStatus);
});

it('should return Not Authorised trying to update votation status as Counter', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.COUNTER, true);
    const votation = await createVotation(ctx, meeting.id, VotationStatus.CHECKING_RESULT, 1);
    const newStatus = VotationStatus.PUBLISHED_RESULT;
    try {
        await ctx.client.request(
            gql`
                mutation UpdateVotationStatus($votationId: String!, $status: VotationStatus!) {
                    updateVotationStatus(votationId: $votationId, status: $status) {
                        id
                        status
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

it('should return Error trying to update votation status from INVALID to PUBLISHED_RESULT', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.COUNTER, true);
    const votation = await createVotation(ctx, meeting.id, VotationStatus.INVALID, 1);
    const newStatus = VotationStatus.PUBLISHED_RESULT;
    try {
        await ctx.client.request(
            gql`
                mutation UpdateVotationStatus($votationId: String!, $status: VotationStatus!) {
                    updateVotationStatus(votationId: $votationId, status: $status) {
                        id
                        status
                    }
                }
            `,
            {
                votationId: votation.id,
                status: newStatus,
            }
        );
        expect(false).toBeTruthy();
    } catch (error) {
        expect(true).toBeTruthy();
    }
});

it('checkIfValidStatusUpdate should throw error trying to update status to OPEN', async () => {
    // checkIfValidStatusUpdate should throw error trying to update status to UPCOMING
    expect(() => {
        checkIfValidStatusUpdate(VotationStatus.OPEN, VotationStatus.UPCOMING);
    }).toThrowError();

    // checkIfValidStatusUpdate should throw error trying to update status to OPEN
    expect(() => {
        checkIfValidStatusUpdate(VotationStatus.UPCOMING, VotationStatus.OPEN);
    }).toThrow();

    // checkIfValidStatusUpdate should throw error trying to update status to CHECKING_RESULT from UPCOMING
    expect(() => {
        checkIfValidStatusUpdate(VotationStatus.UPCOMING, VotationStatus.CHECKING_RESULT);
    }).toThrow();

    // checkIfValidStatusUpdate should return true trying to update status to CHECKING_RESULT from OPEN
    expect(() => {
        checkIfValidStatusUpdate(VotationStatus.OPEN, VotationStatus.CHECKING_RESULT);
    }).toBeTruthy();

    // checkIfValidStatusUpdate should throw error trying to update status to CHECKING_RESULT from INVALID
    expect(() => {
        checkIfValidStatusUpdate(VotationStatus.INVALID, VotationStatus.CHECKING_RESULT);
    }).toThrow();

    // checkIfValidStatusUpdate should throw error trying to update status to CHECKING_RESULT from PUBLISHED_RESULT
    expect(() => {
        checkIfValidStatusUpdate(VotationStatus.PUBLISHED_RESULT, VotationStatus.CHECKING_RESULT);
    }).toThrow();

    // checkIfValidStatusUpdate should throw error trying to update status to PUBLISHED_RESULT from OPEN
    expect(() => {
        checkIfValidStatusUpdate(VotationStatus.OPEN, VotationStatus.PUBLISHED_RESULT);
    }).toThrowError();

    // checkIfValidStatusUpdate should throw error trying to update status to PUBLISHED_RESULT from OPEN
    expect(() => {
        checkIfValidStatusUpdate(VotationStatus.OPEN, VotationStatus.PUBLISHED_RESULT);
    }).toThrowError();

    // checkIfValidStatusUpdate should return true trying to update status to PUBLISHED_RESULT from CHECKING_RESULT'
    expect(() => {
        checkIfValidStatusUpdate(VotationStatus.CHECKING_RESULT, VotationStatus.PUBLISHED_RESULT);
    }).toBeTruthy();

    // checkIfValidStatusUpdate should throw error trying to update status to PUBLISHED_RESULT from INVALID
    expect(() => {
        checkIfValidStatusUpdate(VotationStatus.INVALID, VotationStatus.PUBLISHED_RESULT);
    }).toThrowError();

    // checkIfValidStatusUpdate should throw error trying to update status to INVALID from UPCOMING
    expect(() => {
        checkIfValidStatusUpdate(VotationStatus.UPCOMING, VotationStatus.INVALID);
    }).toThrowError();

    // checkIfValidStatusUpdate should return true trying to update status to INVALID from OPEN
    expect(() => {
        checkIfValidStatusUpdate(VotationStatus.OPEN, VotationStatus.INVALID);
    }).toBeTruthy();

    // checkIfValidStatusUpdate should return true trying to update status to INVALID from CHECKING_RESULT
    expect(() => {
        checkIfValidStatusUpdate(VotationStatus.CHECKING_RESULT, VotationStatus.INVALID);
    }).toBeTruthy();

    // checkIfValidStatusUpdate should throw error trying to update status to INVALID from PUBLISHED_RESULT
    expect(() => {
        checkIfValidStatusUpdate(VotationStatus.PUBLISHED_RESULT, VotationStatus.INVALID);
    }).toThrowError();
});
