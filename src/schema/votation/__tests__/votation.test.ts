import { createTestContext } from '../../../lib/tests/testContext';
import { gql } from 'graphql-request';
import { Status, MajorityType } from '.prisma/client';
const ctx = createTestContext();

interface StaticMeetingDataType {
    title: string;
    startTime: string;
    description: string;
    status: Status;
}

interface StaticVotationDataType {
    title: string;
    description: string;
    blankVotes: boolean;
    majorityType: MajorityType;
    majorityThreshold: number;
}

const meetingTitle = 'test get votation';
const meetingStartTime = '2021-04-13T11:29:58.000Z';
const meetingDescription = 'test get meeting description';
const meetingStatus = 'UPCOMING';
const staticMeetingData: StaticMeetingDataType = {
    title: meetingTitle,
    startTime: meetingStartTime,
    description: meetingDescription,
    status: meetingStatus,
};

const votationTitle = 'test votation title';
const votationDescription = 'test votation description';
const majorityType = 'SIMPLE';
const blankVotes = true;
const majorityThreshold = 50;
const staticVotationData: StaticVotationDataType = {
    title: votationTitle,
    description: votationDescription,
    blankVotes,
    majorityType,
    majorityThreshold,
};

const alternative1Text = 'alternative1 text';

const alternative2Text = 'alternative2 text';

it('should return votation by id', async () => {
    const meetingOwnerId = ctx.userId;
    const meeting = await ctx.prisma.meeting.create({
        data: {
            ...staticMeetingData,
            ownerId: meetingOwnerId,
            participants: {
                create: {
                    userId: ctx.userId,
                    role: 'COUNTER',
                    isVotingEligible: true,
                },
            },
        },
    });
    const meetingId = meeting.id;
    const votationStatus = 'UPCOMING';
    const votation = await ctx.prisma.votation.create({
        data: {
            ...staticVotationData,
            status: votationStatus,
            meetingId,
        },
    });

    const votationId = votation.id;

    const getVotation = await ctx.client.request(
        gql`
            query GetVotationById($votationId: ID!) {
                votationById(votationId: $votationId) {
                    id
                    title
                    description
                    blankVotes
                    majorityType
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
        meetingId,
    });
});

it('should throw error from votation by id', async () => {
    const meetingOwnerId = ctx.userId;
    const meeting = await ctx.prisma.meeting.create({
        data: {
            ...staticMeetingData,
            ownerId: meetingOwnerId,
            participants: {
                create: {
                    userId: ctx.userId,
                    role: 'COUNTER',
                    isVotingEligible: true,
                },
            },
        },
    });
    const meetingId = meeting.id;
    const votationStatus = 'UPCOMING';
    const votation = await ctx.prisma.votation.create({
        data: {
            ...staticVotationData,
            status: votationStatus,
            meetingId,
        },
    });

    expect(
        async () =>
            await ctx.client.request(
                gql`
                    query GetVotationById($votationId: ID!) {
                        votationById(votationId: $votationId) {
                            id
                            title
                            description
                            blankVotes
                            majorityType
                            majorityThreshold
                            meetingId
                        }
                    }
                `,
                {
                    votationId: '1',
                }
            )
    ).rejects.toThrow();
});

it('should return alternatives by votation successfully', async () => {
    const meetingOwnerId = ctx.userId;
    const meeting = await ctx.prisma.meeting.create({
        data: {
            ...staticMeetingData,
            ownerId: meetingOwnerId,
            participants: {
                create: {
                    userId: ctx.userId,
                    role: 'COUNTER',
                    isVotingEligible: true,
                },
            },
        },
    });

    const meetingId = meeting.id;
    const votationStatus = 'UPCOMING';
    const votation = await ctx.prisma.votation.create({
        data: {
            ...staticVotationData,
            status: votationStatus,
            meetingId,
        },
    });

    const votationId = votation.id;
    const alternative1 = await ctx.prisma.alternative.create({
        data: {
            text: alternative1Text,
            votationId,
        },
    });
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
    expect(getAlternatives.alternativesByVotation).toHaveLength(2);
    expect(getAlternatives.alternativesByVotation).toContainEqual(alternative1);
    expect(getAlternatives.alternativesByVotation).toContainEqual(alternative2);
});

it('should return not authorized', async () => {
    const otherUser = await ctx.prisma.user.create({
        data: {
            email: 'test@example.com',
            password: 'hash',
        },
    });
    const meetingOwnerId = otherUser.id;
    const meeting = await ctx.prisma.meeting.create({
        data: {
            ...staticMeetingData,
            ownerId: meetingOwnerId,
            participants: {
                create: {
                    userId: meetingOwnerId,
                    role: 'COUNTER',
                    isVotingEligible: true,
                },
            },
        },
    });
    const meetingId = meeting.id;
    const votationStatus = 'UPCOMING';

    const votation = await ctx.prisma.votation.create({
        data: {
            ...staticVotationData,
            status: votationStatus,
            meetingId,
        },
    });
    const votationId = votation.id;
    await ctx.prisma.alternative.create({
        data: {
            text: alternative1Text,
            votationId,
        },
    });
    await ctx.prisma.alternative.create({
        data: {
            text: alternative2Text,
            votationId,
        },
    });
    expect(
        async () =>
            await ctx.client.request(
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
            )
    ).rejects.toThrow();
});

it('should create votation successfully', async () => {
    const meetingOwnerId = ctx.userId;
    const meeting = await ctx.prisma.meeting.create({
        data: {
            ...staticMeetingData,
            ownerId: meetingOwnerId,
            participants: {
                create: {
                    userId: ctx.userId,
                    role: 'ADMIN',
                    isVotingEligible: true,
                },
            },
        },
    });
    const variables = {
        votation: {
            ...staticVotationData,
            meetingId: meeting.id,
        },
    };
    const createVotation = await ctx.client.request(
        gql`
            mutation CreateVotation($votation: CreateVotationInput!) {
                createVotation(votation: $votation) {
                    title
                    description
                    blankVotes
                    majorityType
                    majorityThreshold
                    meetingId
                }
            }
        `,
        variables
    );
    expect(createVotation.createVotation).toEqual({
        ...variables.votation,
    });
});

it('should not create votation successfully', async () => {
    const meetingOwnerId = ctx.userId;
    const meeting = await ctx.prisma.meeting.create({
        data: {
            ...staticMeetingData,
            ownerId: meetingOwnerId,
            participants: {
                create: {
                    userId: ctx.userId,
                    role: 'COUNTER',
                    isVotingEligible: true,
                },
            },
        },
    });
    const variables = {
        votation: {
            ...staticVotationData,
            meetingId: meeting.id,
        },
    };
    expect(
        async () =>
            await ctx.client.request(
                gql`
                    mutation CreateVotation($votation: CreateVotationInput!) {
                        createVotation(votation: $votation) {
                            title
                            description
                            blankVotes
                            majorityType
                            majorityThreshold
                            meetingId
                        }
                    }
                `,
                variables
            )
    ).rejects.toThrow();
});

it('should create alterative successfully', async () => {
    const meetingOwnerId = ctx.userId;
    const meeting = await ctx.prisma.meeting.create({
        data: {
            ...staticMeetingData,
            ownerId: meetingOwnerId,
            participants: {
                create: {
                    userId: ctx.userId,
                    role: 'ADMIN',
                    isVotingEligible: true,
                },
            },
        },
    });
    const votation = await ctx.prisma.votation.create({
        data: {
            ...staticVotationData,
            meetingId: meeting.id,
        },
    });
    const variables = {
        text: alternative1Text,
        votationId: votation.id,
    };
    const createAlternative = await ctx.client.request(
        gql`
            mutation CreateAlternative($text: String!, $votationId: String!) {
                createAlternative(text: $text, votationId: $votationId) {
                    text
                    votationId
                }
            }
        `,
        variables
    );
    expect(createAlternative.createAlternative).toEqual(variables);
});

it('should not create alternative successfully', async () => {
    const meetingOwnerId = ctx.userId;
    const meeting = await ctx.prisma.meeting.create({
        data: {
            ...staticMeetingData,
            ownerId: meetingOwnerId,
            participants: {
                create: {
                    userId: ctx.userId,
                    role: 'COUNTER',
                    isVotingEligible: true,
                },
            },
        },
    });
    const votation = await ctx.prisma.votation.create({
        data: {
            ...staticVotationData,
            meetingId: meeting.id,
        },
    });
    const variables = {
        text: alternative1Text,
        votationId: votation.id,
    };
    expect(
        async () =>
            await ctx.client.request(
                gql`
                    mutation CreateAlternative($text: String!, $votationId: String!) {
                        createAlternative(text: $text, votationId: $votationId) {
                            text
                            votationId
                        }
                    }
                `,
                variables
            )
    ).rejects.toThrow();
});
