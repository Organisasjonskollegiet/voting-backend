import { createTestContext } from '../../../lib/tests/testContext';
import { gql } from 'graphql-request';
const ctx = createTestContext('votation');

it('should return alternatives by votation successfully', async () => {
    const meetingTitle = 'test get votation';
    const meetingStartTime = '2021-04-13T11:29:58.000Z';
    const meetingDescription = 'test get meeting description';
    const meetingStatus = 'UPCOMING';
    const meetingOwnerId = ctx.user.id;
    const meeting = await ctx.prisma.meeting.create({
        data: {
            title: meetingTitle,
            startTime: meetingStartTime,
            description: meetingDescription,
            status: meetingStatus,
            ownerId: meetingOwnerId,
            participants: {
                create: {
                    userId: ctx.user.id,
                    role: 'COUNTER',
                    isVotingEligible: true,
                },
            },
        },
    });
    const votationTitle = 'test votation title';
    const votationDescription = 'test votation description';
    const votationOrder = 1;
    const votationStatus = 'UPCOMING';
    const majorityType = 'SIMPLE';
    const blankVotes = true;
    const majorityThreshold = 50;
    const meetingId = meeting.id;
    const votation = await ctx.prisma.votation.create({
        data: {
            title: votationTitle,
            description: votationDescription,
            order: votationOrder,
            status: votationStatus,
            blankVotes,
            majorityType,
            majorityThreshold,
            meetingId,
        },
    });
    const alternative1Text = 'alternative1 text';
    const votationId = votation.id;
    const alternative1 = await ctx.prisma.alternative.create({
        data: {
            text: alternative1Text,
            votationId,
        },
    });
    const alternative2Text = 'alternative2 text';
    const alternative2 = await ctx.prisma.alternative.create({
        data: {
            text: alternative2Text,
            votationId,
        },
    });
    const getAlternatives = await ctx.client.request(
        gql`
            query AlternativesByVotation($votationId: String!) {
                alternativesByVotation(votationId: $votationId) {
                    id
                    text
                    votationId
                }
            }
        `,
        {
            votationId,
        }
    );
    console.log(getAlternatives);
});
