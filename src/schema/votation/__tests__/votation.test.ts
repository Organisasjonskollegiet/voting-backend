import { createTestContext } from '../../../lib/tests/testContext';
import { gql } from 'graphql-request';
import { Status, MajorityType, Role } from '.prisma/client';
import { execPath } from 'node:process';
import { uuid } from 'casual';
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

const createVotation = async (meetingId: string, status: Status, index: number) => {
    return await ctx.prisma.votation.create({
        data: {
            ...staticVotationData,
            status: status,
            index,
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
    const votation = await createVotation(meeting.id, 'UPCOMING', 1);
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
    await createVotation(meeting.id, 'UPCOMING', 1);
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
    const votation = await createVotation(meeting.id, 'UPCOMING', 1);
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
    const votation = await createVotation(meeting.id, 'UPCOMING', 1);
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
                index: 1,
                alternatives: ['alternative1', 'alternative2'],
            },
            {
                ...staticVotationData,
                index: 2,
                alternatives: [],
            },
        ],
    };
    const createVotations = await ctx.client.request(
        gql`
            mutation CreateVotations($meetingId: String!, $votations: [CreateVotationInput!]!) {
                createVotations(meetingId: $meetingId, votations: $votations) {
                    id
                    title
                    description
                    index
                    blankVotes
                    hiddenVotes
                    severalVotes
                    majorityType
                    majorityThreshold
                    alternatives {
                        text
                    }
                }
            }
        `,
        variables
    );
    const alternativesCountFirstVotation = await ctx.prisma.alternative.count({
        where: {
            votationId: createVotations.createVotations[0].id,
        },
    });
    const alternativesCountSecondVotation = await ctx.prisma.alternative.count({
        where: {
            votationId: createVotations.createVotations[1].id,
        },
    });
    expect(
        createVotations.createVotations.map((votation: any) => {
            return {
                ...votation,
                id: '',
                alternatives: [],
            };
        })
    ).toEqual(
        variables.votations.map((votation) => {
            return {
                ...votation,
                id: '',
                alternatives: [],
            };
        })
    );
    expect(createVotations.createVotations.length).toEqual(2);
    expect(alternativesCountFirstVotation).toEqual(2);
    expect(alternativesCountSecondVotation).toEqual(0);
});

it('should update votations successfully', async () => {
    const alternative1UpdatedText = 'alternative1Updated';
    const alternative2UpdatedText = 'alternative2Updated';
    const alternative3UpdatedText = 'alternative3Updated';
    const alternative4UpdatedText = 'alternative4Updated';
    const meeting = await createMeeting(ctx.userId, 'ADMIN');
    const votation1 = await createVotation(meeting.id, 'UPCOMING', 1);
    const alternative1 = await createAlternative(votation1.id, 'alternative1');
    const alternative2 = await createAlternative(votation1.id, 'alternative2');
    const votation2 = await createVotation(meeting.id, 'UPCOMING', 2);
    const alternative3 = await createAlternative(votation2.id, 'alternative3');
    const alternative4 = await createAlternative(votation2.id, 'alternative4');
    const variables = {
        votations: [
            {
                id: votation1.id,
                ...updatedStaticVotationData,
                index: 2,
                alternatives: [
                    {
                        id: alternative1.id,
                        text: alternative1UpdatedText,
                    },
                    {
                        id: alternative2.id,
                        text: alternative2UpdatedText,
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
                    },
                    {
                        id: alternative4.id,
                        text: alternative4UpdatedText,
                    },
                    {
                        id: uuid,
                        text: 'alternative5',
                    },
                ],
            },
        ],
    };
    await ctx.client.request(
        gql`
            mutation UpdateVotations($votations: [UpdateVotationInput!]!) {
                updateVotations(votations: $votations) {
                    id
                    title
                    description
                    blankVotes
                    hiddenVotes
                    severalVotes
                    majorityType
                    majorityThreshold
                    index
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
    expect(votation1Updated?.index).toEqual(variables.votations[0].index);
    expect(votation2Updated?.index).toEqual(variables.votations[1].index);
    expect(alternative1Updated?.text).toEqual(alternative1UpdatedText);
    expect(alternativeToVotation2Count).toEqual(3);
});

it('should not update votation successfully', async () => {
    const alternative1UpdatedText = 'alternative1Updated';
    const alternative2UpdatedText = 'alternative2Updated';
    const alternative3UpdatedText = 'alternative3Updated';
    const alternative4UpdatedText = 'alternative4Updated';
    const meeting = await createMeeting(ctx.userId, 'COUNTER');
    const votation1 = await createVotation(meeting.id, 'UPCOMING', 1);
    const alternative1 = await createAlternative(votation1.id, 'alternative1');
    const alternative2 = await createAlternative(votation1.id, 'alternative2');
    const votation2 = await createVotation(meeting.id, 'UPCOMING', 2);
    const alternative3 = await createAlternative(votation1.id, 'alternative3');
    const alternative4 = await createAlternative(votation1.id, 'alternative4');
    const variables = {
        votations: [
            {
                id: votation1.id,
                ...updatedStaticVotationData,
                index: 2,
                alternatives: [
                    {
                        id: alternative1.id,
                        text: alternative1UpdatedText,
                    },
                    {
                        id: alternative2.id,
                        text: alternative2UpdatedText,
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
                    },
                    {
                        id: alternative4.id,
                        text: alternative4UpdatedText,
                    },
                    {
                        id: uuid,
                        text: 'alternative5',
                    },
                ],
            },
        ],
    };
    try {
        await ctx.client.request(
            gql`
                mutation UpdateVotations($votations: [UpdateVotationInput!]!) {
                    updateVotations(votations: $votations) {
                        id
                        title
                        description
                        blankVotes
                        hiddenVotes
                        severalVotes
                        majorityType
                        majorityThreshold
                        index
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
                index: 1,
                alternatives: [],
            },
            {
                ...staticVotationData,
                index: 2,
                alternatives: [],
            },
        ],
    };
    try {
        await ctx.client.request(
            gql`
                mutation CreateVotations($meetingId: String!, $votations: [CreateVotationInput!]!) {
                    createVotations(meetingId: $meetingId, votations: $votations) {
                        id
                        title
                        description
                        index
                        blankVotes
                        hiddenVotes
                        severalVotes
                        majorityType
                        majorityThreshold
                        alternatives {
                            text
                        }
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

it('should create alterative successfully', async () => {
    const meeting = await createMeeting(ctx.userId, 'ADMIN');
    const votation = await createVotation(meeting.id, 'UPCOMING', 1);
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
    const votation = await createVotation(meeting.id, 'UPCOMING', 1);
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
    const votation = await createVotation(meeting.id, 'UPCOMING', 1);
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
    const votation = await createVotation(meeting.id, 'UPCOMING', 1);
    await createAlternative(votation.id, 'alternative');
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
    const votation = await createVotation(meeting.id, 'UPCOMING', 1);
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
    const votation = await createVotation(meeting.id, 'UPCOMING', 1);
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
