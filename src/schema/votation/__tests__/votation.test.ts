import { createTestContext } from '../../../lib/tests/testContext';
import { gql } from 'graphql-request';
import { Status, MajorityType, Role } from '.prisma/client';
import { execPath } from 'node:process';
const ctx = createTestContext();

interface StaticMeetingDataType {
    organization: string;
    title: string;
    startTime: string;
    description: string;
    status: Status;
}

interface StaticVotationDataType {
    title: string;
    description: string;
    blankVotes: boolean;
    hiddenVotes: boolean;
    severalVotes: boolean;
    majorityType: MajorityType;
    majorityThreshold: number;
}

const organization = 'organization';
const meetingTitle = 'test get votation';
const meetingStartTime = '2021-04-13T11:29:58.000Z';
const meetingDescription = 'test get meeting description';
const meetingStatus = 'UPCOMING';
const staticMeetingData: StaticMeetingDataType = {
    organization,
    title: meetingTitle,
    startTime: meetingStartTime,
    description: meetingDescription,
    status: meetingStatus,
};

const votationTitle = 'test votation title';
const votationDescription = 'test votation description';
const majorityType = 'SIMPLE';
const blankVotes = true;
const hiddenVotes = true;
const severalVotes = true;
const majorityThreshold = 50;
const staticVotationData: StaticVotationDataType = {
    title: votationTitle,
    description: votationDescription,
    blankVotes,
    hiddenVotes,
    severalVotes,
    majorityType,
    majorityThreshold,
};

const updatedVotationTitle = 'updated votation title';
const updatedVotationDescription = 'updated votation description';
const updatedMajorityType = 'QUALIFIED';
const updatedBlankVotes = false;
const updatedHiddenVotes = false;
const updatedSeveralVotes = false;
const updatedMajorityThreshold = 60;
const updatedStaticVotationData: StaticVotationDataType = {
    title: updatedVotationTitle,
    description: updatedVotationDescription,
    blankVotes: updatedBlankVotes,
    hiddenVotes: updatedHiddenVotes,
    severalVotes: updatedSeveralVotes,
    majorityType: updatedMajorityType,
    majorityThreshold: updatedMajorityThreshold,
};

const alternative1Text = 'alternative1 text';

const alternative2Text = 'alternative2 text';

const createMeeting = async (ownerId: string, role: Role) => {
    return await ctx.prisma.meeting.create({
        data: {
            ...staticMeetingData,
            ownerId: ownerId,
            participants: {
                create: {
                    userId: ownerId,
                    role: role,
                    isVotingEligible: true,
                },
            },
        },
    });
};

const createVotation = async (meetingId: string, status: Status) => {
    return await ctx.prisma.votation.create({
        data: {
            ...staticVotationData,
            status: status,
            meetingId,
        },
    });
};

const createAlternative = async (votationId: string, text: string) => {
    return ctx.prisma.alternative.create({
        data: {
            text,
            votationId,
        },
    });
};

it('should return votation by id', async () => {
    const meeting = await createMeeting(ctx.userId, 'COUNTER');
    const votation = await createVotation(meeting.id, 'UPCOMING');
    const votationId = votation.id;
    const getVotation = await ctx.client.request(
        gql`
            query GetVotationById($votationId: ID!) {
                votationById(votationId: $votationId) {
                    id
                    title
                    description
                    blankVotes
                    hiddenVotes
                    severalVotes
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
        meetingId: meeting.id,
    });
});

it('should throw error from votation by id', async () => {
    const meeting = await createMeeting(ctx.userId, 'COUNTER');
    await createVotation(meeting.id, 'UPCOMING');
    try {
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
        );
        expect(false).toBeTruthy();
    } catch (error) {
        expect(error.message).toContain('Not Authorised!');
    }
});

it('should return alternatives by votation successfully', async () => {
    const meeting = await createMeeting(ctx.userId, 'COUNTER');
    const votation = await createVotation(meeting.id, 'UPCOMING');
    const alternative1 = await createAlternative(votation.id, alternative1Text);
    const alternative2 = await createAlternative(votation.id, alternative2Text);
    const votationId = votation.id;
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
    const meeting = await createMeeting(otherUser.id, 'COUNTER');
    const votation = await createVotation(meeting.id, 'UPCOMING');
    await createAlternative(votation.id, alternative1Text);
    await createAlternative(votation.id, alternative2Text);
    try {
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
                votationId: votation.id,
            }
        );
    } catch (error) {
        expect(error.message).toContain('Not Authorised!');
    }
});

it('should create votations successfully', async () => {
    const meeting = await createMeeting(ctx.userId, 'ADMIN');
    const variables = {
        meetingId: meeting.id,
        votations: [
            {
                ...staticVotationData,
                alternatives: ['alternative1', 'alternative2'],
            },
            {
                ...staticVotationData,
            },
        ],
    };
    const createVotations = await ctx.client.request(
        gql`
            mutation CreateVotations($meetingId: String!, $votations: [CreateVotationInput!]!) {
                createVotations(meetingId: $meetingId, votations: $votations)
            }
        `,
        variables
    );
    const alternativesCountFirstVotation = await ctx.prisma.alternative.count({
        where: {
            votationId: createVotations.createVotations[0],
        },
    });
    const alternativesCountSecondVotation = await ctx.prisma.alternative.count({
        where: {
            votationId: createVotations.createVotations[1],
        },
    });
    expect(createVotations.createVotations.length).toEqual(2);
    expect(alternativesCountFirstVotation).toEqual(2);
    expect(alternativesCountSecondVotation).toEqual(0);
});

it('should update votation successfully', async () => {
    const meeting = await createMeeting(ctx.userId, 'ADMIN');
    const votation = await createVotation(meeting.id, 'UPCOMING');
    const variables = {
        votation: {
            id: votation.id,
            ...updatedStaticVotationData,
        },
    };
    const updateVotation = await ctx.client.request(
        gql`
            mutation UpdateVotation($votation: UpdateVotationInput!) {
                updateVotation(votation: $votation) {
                    id
                    title
                    description
                    blankVotes
                    hiddenVotes
                    severalVotes
                    majorityType
                    majorityThreshold
                }
            }
        `,
        variables
    );
    expect(updateVotation.updateVotation).toEqual({
        ...variables.votation,
    });
});

it('should not update votation successfully', async () => {
    const meeting = await createMeeting(ctx.userId, 'COUNTER');
    const votation = await createVotation(meeting.id, 'UPCOMING');
    const variables = {
        votation: {
            id: votation.id,
            ...updatedStaticVotationData,
        },
    };
    try {
        await ctx.client.request(
            gql`
                mutation UpdateVotation($votation: UpdateVotationInput!) {
                    updateVotation(votation: $votation) {
                        id
                        title
                        description
                        blankVotes
                        majorityType
                        majorityThreshold
                    }
                }
            `,
            variables
        );
        expect(false).toBeTruthy();
    } catch (error) {
        expect(error.message).toContain('Not Authorised!');
    }
});

it('should not create votations successfully', async () => {
    const meeting = await createMeeting(ctx.userId, 'COUNTER');
    const variables = {
        meetingId: meeting.id,
        votations: [
            {
                ...staticVotationData,
            },
            {
                ...staticVotationData,
            },
        ],
    };
    try {
        await ctx.client.request(
            gql`
                mutation CreateVotations($meetingId: String!, $votations: [CreateVotationInput!]!) {
                    createVotations(meetingId: $meetingId, votations: $votations)
                }
            `,
            variables
        );
        expect(false).toBeTruthy();
    } catch (error) {
        expect(error.message).toContain('Not Authorised!');
    }
});

it('should create alterative successfully', async () => {
    const meeting = await createMeeting(ctx.userId, 'ADMIN');
    const votation = await createVotation(meeting.id, 'UPCOMING');
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
    const meeting = await createMeeting(ctx.userId, 'COUNTER');
    const votation = await createVotation(meeting.id, 'UPCOMING');
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

it('should delete alternative successfully', async () => {
    const meeting = await createMeeting(ctx.userId, 'ADMIN');
    const votation = await createVotation(meeting.id, 'UPCOMING');
    const alternative = await createAlternative(votation.id, alternative1Text);
    await ctx.client.request(
        gql`
            mutation DeleteAlternative($id: String!) {
                deleteAlternative(id: $id) {
                    id
                    text
                }
            }
        `,
        {
            id: alternative.id,
        }
    );
    const numberOfAlternativesWithId = await ctx.prisma.alternative.count({ where: { id: alternative.id } });
    expect(numberOfAlternativesWithId).toBe(0);
});

it('should delete votation successfully', async () => {
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
    await ctx.prisma.alternative.create({
        data: {
            text: 'alternative',
            votationId: votation.id,
        },
    });
    await ctx.client.request(
        gql`
            mutation DeleteVotation($id: String!) {
                deleteVotation(id: $id) {
                    id
                }
            }
        `,
        {
            id: votation.id,
        }
    );
    const numberOfVotationsWithId = await ctx.prisma.votation.count({ where: { id: votation.id } });
    expect(numberOfVotationsWithId).toBe(0);
});

it('should not delete alternative successfully', async () => {
    const meetingOwner = await ctx.prisma.user.create({
        data: {
            email: 'e@mail.com',
            password: 'secret',
        },
    });
    const meeting = await createMeeting(meetingOwner.id, 'COUNTER');
    const votation = await createVotation(meeting.id, 'UPCOMING');
    const alternative = await createAlternative(votation.id, alternative1Text);
    try {
        await ctx.client.request(
            gql`
                mutation DeleteAlternative($id: String!) {
                    deleteAlternative(id: $id) {
                        id
                        text
                    }
                }
            `,
            {
                id: alternative.id,
            }
        );
        expect(false).toBeTruthy();
    } catch (error) {
        expect(error.message).toContain('Not Authorised!');
    }
});

it('should not delete votation successfully', async () => {
    const meetingOwner = await ctx.prisma.user.create({
        data: {
            email: 'e@mail.com',
            password: 'secret',
        },
    });
    const meeting = await createMeeting(meetingOwner.id, 'COUNTER');
    const votation = await createVotation(meeting.id, 'UPCOMING');
    await createAlternative(votation.id, alternative1Text);
    try {
        await ctx.client.request(
            gql`
                mutation DeleteVotation($id: String!) {
                    deleteVotation(id: $id) {
                        id
                    }
                }
            `,
            {
                id: votation.id,
            }
        );
        expect(false).toBeTruthy();
    } catch (error) {
        expect(error.message).toContain('Not Authorised!');
    }
});
