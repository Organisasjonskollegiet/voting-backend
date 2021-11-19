import { createMeeting, createVotation, createAlternative } from '../../../lib/tests/utils';
import { createTestContext } from '../../../lib/tests/testContext';
import { VotationStatus, Role } from '.prisma/client';
import { gql } from 'graphql-request';
const ctx = createTestContext();

it('should delete alternative successfully as Admin', async () => {
    const alt1 = 'alt1';
    const alt2 = 'alt2';
    const meeting = await createMeeting(ctx, ctx.userId, Role.ADMIN, true);
    const votation = await createVotation(ctx, meeting.id, VotationStatus.UPCOMING, 1);
    const alternative1 = await createAlternative(ctx, votation.id, alt1);
    const alternative2 = await createAlternative(ctx, votation.id, alt2);
    await ctx.client.request(
        gql`
            mutation DeleteAlternatives($ids: [String!]!) {
                deleteAlternatives(ids: $ids)
            }
        `,
        {
            ids: [alternative1.id],
        }
    );
    const alternativesForVotation = await ctx.prisma.alternative.count({ where: { votationId: votation.id } });
    const alternative1Count = await ctx.prisma.alternative.count({ where: { id: alternative1.id } });
    expect(alternativesForVotation).toBe(1);
    expect(alternative1Count).toBe(0);
});

it('should not delete alternative successfully as Counter were counter of ', async () => {
    const text = 'alternative';
    const meeting = await createMeeting(ctx, ctx.userId, Role.COUNTER, true);
    const votation = await createVotation(ctx, meeting.id, VotationStatus.UPCOMING, 1);
    await createAlternative(ctx, votation.id, text);
    try {
        await ctx.client.request(
            gql`
                mutation DeleteAlternatives($ids: [String!]!) {
                    deleteAlternatives(ids: $ids)
                }
            `,
            {
                ids: [votation.id],
            }
        );
        expect(false).toBeTruthy();
    } catch (error: any) {
        expect(error.message).toContain('Not Authorised!');
    }
});
