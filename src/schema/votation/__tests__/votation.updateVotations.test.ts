import {
    createMeeting,
    createVotation,
    createAlternative,
    formatVotationToCompare,
    updatedStaticVotationData,
} from '../../../lib/tests/utils';
import { createTestContext } from '../../../lib/tests/testContext';
import { VotationStatus, Role } from '.prisma/client';
import { uuid } from 'casual';
import { gql } from 'graphql-request';
const ctx = createTestContext();

it('should update votations successfully', async () => {
    const alternative1UpdatedText = 'alternative1Updated';
    const alternative2UpdatedText = 'alternative2Updated';
    const alternative3UpdatedText = 'alternative3Updated';
    const alternative4UpdatedText = 'alternative4Updated';
    const meeting = await createMeeting(ctx, ctx.userId, Role.ADMIN, true);
    const votation1 = await createVotation(ctx, meeting.id, VotationStatus.UPCOMING, 1);
    const alternative1 = await createAlternative(ctx, votation1.id, 'alternative1');
    const alternative2 = await createAlternative(ctx, votation1.id, 'alternative2');
    const votation2 = await createVotation(ctx, meeting.id, VotationStatus.UPCOMING, 2);
    const alternative3 = await createAlternative(ctx, votation2.id, 'alternative3');
    const alternative4 = await createAlternative(ctx, votation2.id, 'alternative4');
    const variables = {
        meetingId: meeting.id,
        votations: [
            {
                id: votation1.id,
                ...updatedStaticVotationData,
                index: 2,
                alternatives: [
                    {
                        id: alternative1.id,
                        text: alternative1UpdatedText,
                        index: 0,
                    },
                    {
                        id: alternative2.id,
                        text: alternative2UpdatedText,
                        index: 1,
                    },
                ],
            },
            {
                id: votation2.id,
                ...updatedStaticVotationData,
                index: 1,
                alternatives: [
                    {
                        id: alternative3.id,
                        text: alternative3UpdatedText,
                        index: 0,
                    },
                    {
                        id: alternative4.id,
                        text: alternative4UpdatedText,
                        index: 1,
                    },
                    {
                        id: uuid,
                        text: 'alternative5',
                        index: 2,
                    },
                ],
            },
        ],
    };
    await ctx.client.request(
        gql`
            mutation UpdateVotations($votations: [UpdateVotationInput!]!, $meetingId: String!) {
                updateVotations(votations: $votations, meetingId: $meetingId) {
                    id
                    title
                    description
                    blankVotes
                    hiddenVotes
                    type
                    majorityThreshold
                    numberOfWinners
                    index
                    status
                    alternatives {
                        text
                    }
                }
            }
        `,
        variables
    );
    const votation1Updated = await ctx.prisma.votation.findUnique({
        where: {
            id: votation1.id,
        },
    });
    const alternative1Updated = await ctx.prisma.alternative.findUnique({
        where: {
            id: alternative1.id,
        },
    });
    const votation2Updated = await ctx.prisma.votation.findUnique({
        where: {
            id: votation2.id,
        },
    });
    const alternativeToVotation2Count = await ctx.prisma.alternative.count({
        where: {
            votationId: votation2.id,
        },
    });
    if (!votation1Updated || !votation2Updated || !alternative1Updated || !alternativeToVotation2Count) {
        expect(false).toBeTruthy();
    } else {
        expect(formatVotationToCompare(votation1Updated)).toEqual(formatVotationToCompare(variables.votations[0]));
        expect(formatVotationToCompare(votation2Updated)).toEqual(formatVotationToCompare(variables.votations[1]));
        expect(alternative1Updated?.text).toEqual(alternative1UpdatedText);
        expect(alternativeToVotation2Count).toEqual(3);
    }
});

it('should not update votations successfully', async () => {
    const alternative1UpdatedText = 'alternative1Updated';
    const alternative2UpdatedText = 'alternative2Updated';
    const alternative3UpdatedText = 'alternative3Updated';
    const alternative4UpdatedText = 'alternative4Updated';
    const meeting = await createMeeting(ctx, ctx.userId, Role.COUNTER, true);
    const votation1 = await createVotation(ctx, meeting.id, VotationStatus.UPCOMING, 1);
    const alternative1 = await createAlternative(ctx, votation1.id, 'alternative1');
    const alternative2 = await createAlternative(ctx, votation1.id, 'alternative2');
    const votation2 = await createVotation(ctx, meeting.id, VotationStatus.UPCOMING, 2);
    const alternative3 = await createAlternative(ctx, votation1.id, 'alternative3');
    const alternative4 = await createAlternative(ctx, votation1.id, 'alternative4');
    const variables = {
        meetingId: meeting.id,
        votations: [
            {
                id: votation1.id,
                ...updatedStaticVotationData,
                index: 2,
                alternatives: [
                    {
                        id: alternative1.id,
                        text: alternative1UpdatedText,
                        index: 0,
                    },
                    {
                        id: alternative2.id,
                        text: alternative2UpdatedText,
                        index: 1,
                    },
                ],
            },
            {
                id: votation2.id,
                ...updatedStaticVotationData,
                index: 3,
                alternatives: [
                    {
                        id: alternative3.id,
                        text: alternative3UpdatedText,
                        index: 0,
                    },
                    {
                        id: alternative4.id,
                        text: alternative4UpdatedText,
                        index: 1,
                    },
                    {
                        id: uuid,
                        text: 'alternative5',
                        index: 2,
                    },
                ],
            },
        ],
    };
    try {
        await ctx.client.request(
            gql`
                mutation UpdateVotations($votations: [UpdateVotationInput!]!, $meetingId: String!) {
                    updateVotations(votations: $votations, meetingId: $meetingId) {
                        id
                        title
                        description
                        blankVotes
                        hiddenVotes
                        type
                        majorityThreshold
                        numberOfWinners
                        index
                    }
                }
            `,
            variables
        );
        expect(false).toBeTruthy();
    } catch (error: any) {
        expect(error.message).toContain('Not Authorised!');
    }
});
