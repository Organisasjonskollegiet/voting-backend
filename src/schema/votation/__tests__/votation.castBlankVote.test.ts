import { createMeeting, createVotation } from '../../../lib/tests/utils';
import { createTestContext } from '../../../lib/tests/testContext';
import { VotationStatus, Role } from '.prisma/client';
import { gql } from 'graphql-request';
const ctx = createTestContext();

it('should successfully cast a blank vote', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.PARTICIPANT, true);
    const votation = await createVotation(ctx, meeting.id, VotationStatus.OPEN, 2, 'SIMPLE', 1, 50, true);
    expect(votation.blankVoteCount).toEqual(0);
    const blankVoteCount = await ctx.client.request(
        gql`
            mutation CastBlankVote($votationId: String!) {
                castBlankVote(votationId: $votationId)
            }
        `,
        { votationId: votation.id }
    );
    expect(blankVoteCount.castBlankVote).toEqual(votation.id);
    const updatedVotation = await ctx.prisma.votation.findUnique({ where: { id: votation.id } });
    expect(updatedVotation?.blankVoteCount).toEqual(1);
});

it('should fail to cast a blank vote if you voted', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.PARTICIPANT, true);
    const votation = await createVotation(ctx, meeting.id, VotationStatus.OPEN, 1, 'SIMPLE', 1, 50, true);
    await ctx.prisma.hasVoted.create({ data: { votationId: votation.id, userId: ctx.userId } });
    try {
        await ctx.client.request(
            gql`
                mutation CastBlankVote($votationId: String!) {
                    castBlankVote(votationId: $votationId)
                }
            `,
            { votationId: votation.id }
        );
    } catch (error: any) {
        expect(error.message).toContain('Not Authorised!');
        // Check if the votation still has 0 blank votes.
        const sameVotation = await ctx.prisma.votation.findUnique({ where: { id: votation.id } });
        expect(sameVotation?.blankVoteCount).toEqual(0);
    }
});
