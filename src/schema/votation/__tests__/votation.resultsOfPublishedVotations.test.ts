import { createMeeting, createVotation, createAlternative, createUser } from '../../../lib/tests/utils';
import { createTestContext } from '../../../lib/tests/testContext';
import { VotationStatus, Role } from '.prisma/client';
import casual from 'casual';
import { gql } from 'graphql-request';
const ctx = createTestContext();

it('should return votation id with results (alternative with isWinner) for all votatons of meeting', async () => {
    const meeting = await createMeeting(ctx, ctx.userId, Role.PARTICIPANT, true);
    const publishedVotation = await createVotation(ctx, meeting.id, VotationStatus.PUBLISHED_RESULT, 1);
    await createVotation(ctx, meeting.id, VotationStatus.CHECKING_RESULT, 1);
    const winner = await createAlternative(ctx, publishedVotation.id, casual.title, true);
    const loser = await createAlternative(ctx, publishedVotation.id, casual.title, false);
    const response = await ctx.client.request(
        gql`
            query GetResultsOfPublishedVotations($meetingId: String!) {
                resultsOfPublishedVotations(meetingId: $meetingId) {
                    id
                    alternatives {
                        id
                        text
                        isWinner
                    }
                }
            }
        `,
        {
            meetingId: meeting.id,
        }
    );
    const result = response.resultsOfPublishedVotations[0];
    expect(result.id).toEqual(publishedVotation.id);
    expect(result.alternatives.length).toEqual(2);
    expect(result.alternatives).toEqual(
        expect.arrayContaining([
            {
                id: winner.id,
                text: winner.text,
                isWinner: true,
            },
            {
                id: loser.id,
                text: loser.text,
                isWinner: false,
            },
        ])
    );
});

it('should return not authorised trying to get results of published votations', async () => {
    const otherUser = await createUser(ctx);
    const meeting = await createMeeting(ctx, otherUser.id, Role.PARTICIPANT, true);
    const publishedVotation = await createVotation(ctx, meeting.id, VotationStatus.PUBLISHED_RESULT, 1);
    await createAlternative(ctx, publishedVotation.id, casual.title, true);
    await createAlternative(ctx, publishedVotation.id, casual.title, false);
    try {
        await ctx.client.request(
            gql`
                query GetResultsOfPublishedVotations($meetingId: String!) {
                    resultsOfPublishedVotations(meetingId: $meetingId) {
                        id
                        alternatives {
                            id
                            text
                            isWinner
                        }
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
