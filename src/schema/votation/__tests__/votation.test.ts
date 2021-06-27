import { createTestContext } from '../../../lib/tests/testContext';
import { gql } from 'graphql-request';
import { Status, MajorityType, Role } from '.prisma/client';
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
const meetingStatus = Status.UPCOMING;
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

const createMeeting = async (ownerId: string, role: Role, isVotingEligible: boolean) => {
    return await ctx.prisma.meeting.create({
        data: {
            ...staticMeetingData,
            ownerId: ownerId,
            participants: {
                create: {
                    userId: ownerId,
                    role: role,
                    isVotingEligible: isVotingEligible,
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

const formatVotationToCompare = (votation: any) => {
    return {
        title: votation.title,
        description: votation.description,
        blankVotes: votation.blankVotes,
        hiddenVotes: votation.hiddenVotes,
        severalVotes: votation.severalVotes,
        majorityType: votation.majorityType,
        majorityThreshold: votation.majorityThreshold,
        index: votation.index,
    };
};

it('should return votation by id', async () => {
    const meeting = await createMeeting(ctx.userId, Role.COUNTER, true);
    const votation = await createVotation(meeting.id, Status.UPCOMING, 1);
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
    const meeting = await createMeeting(ctx.userId, Role.COUNTER, true);
    await createVotation(meeting.id, Status.UPCOMING, 1);
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
    const meeting = await createMeeting(ctx.userId, Role.COUNTER, true);
    const votation = await createVotation(meeting.id, Status.UPCOMING, 1);
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
    const meeting = await createMeeting(otherUser.id, Role.COUNTER, true);
    const votation = await createVotation(meeting.id, Status.UPCOMING, 1);
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
    const meeting = await createMeeting(ctx.userId, Role.ADMIN, true);
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
    const meeting = await createMeeting(ctx.userId, Role.ADMIN, true);
    const votation1 = await createVotation(meeting.id, Status.UPCOMING, 1);
    const alternative1 = await createAlternative(votation1.id, 'alternative1');
    const alternative2 = await createAlternative(votation1.id, 'alternative2');
    const votation2 = await createVotation(meeting.id, Status.UPCOMING, 2);
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
    const meeting = await createMeeting(ctx.userId, Role.COUNTER, true);
    const votation1 = await createVotation(meeting.id, Status.UPCOMING, 1);
    const alternative1 = await createAlternative(votation1.id, 'alternative1');
    const alternative2 = await createAlternative(votation1.id, 'alternative2');
    const votation2 = await createVotation(meeting.id, Status.UPCOMING, 2);
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
    const meeting = await createMeeting(ctx.userId, Role.COUNTER, true);
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
    const meeting = await createMeeting(ctx.userId, Role.ADMIN, true);
    const votation = await createVotation(meeting.id, Status.UPCOMING, 1);
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
    const meeting = await createMeeting(ctx.userId, Role.COUNTER, true);
    const votation = await createVotation(meeting.id, Status.UPCOMING, 1);
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
    const meeting = await createMeeting(ctx.userId, Role.ADMIN, true);
    const votation = await createVotation(meeting.id, Status.UPCOMING, 1);
    const alternative1 = await createAlternative(votation.id, alternative1Text);
    const alternative2 = await createAlternative(votation.id, alternative2Text);
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
    const numberOfAlternativesWithId1 = await ctx.prisma.alternative.count({ where: { id: alternative1.id } });
    const numberOfAlternativesWithId2 = await ctx.prisma.alternative.count({ where: { id: alternative2.id } });
    expect(numberOfAlternativesWithId1).toBe(0);
    expect(numberOfAlternativesWithId2).toBe(1);
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
                    role: Role.ADMIN,
                    isVotingEligible: true,
                },
            },
        },
    });
    const votation1 = await createVotation(meeting.id, Status.UPCOMING, 1);
    const votation2 = await createVotation(meeting.id, Status.UPCOMING, 2);
    await createAlternative(votation1.id, 'alternative');
    await ctx.client.request(
        gql`
            mutation DeleteVotations($ids: [String!]!) {
                deleteVotations(ids: $ids)
            }
        `,
        {
            ids: [votation1.id],
        }
    );
    const numberOfVotationsWithId1 = await ctx.prisma.votation.count({ where: { id: votation1.id } });
    const numberOfVotationsWithId2 = await ctx.prisma.votation.count({ where: { id: votation2.id } });
    expect(numberOfVotationsWithId1).toBe(0);
    expect(numberOfVotationsWithId2).toBe(1);
});

it('should not delete alternative successfully', async () => {
    const meeting1 = await createMeeting(ctx.userId, Role.COUNTER, true);
    const meeting2 = await createMeeting(ctx.userId, Role.ADMIN, true);
    const votation1 = await createVotation(meeting1.id, Status.UPCOMING, 1);
    const votation2 = await createVotation(meeting2.id, Status.UPCOMING, 1);
    await createAlternative(votation1.id, alternative1Text);
    try {
        await ctx.client.request(
            gql`
                mutation DeleteAlternatives($ids: [String!]!) {
                    deleteAlternatives(ids: $ids)
                }
            `,
            {
                ids: [votation1.id, votation2.id],
            }
        );
        expect(false).toBeTruthy();
    } catch (error) {
        expect(error.message).toContain('Not Authorised!');
    }
});

it('should not delete votation successfully', async () => {
    const meeting1 = await createMeeting(ctx.userId, Role.COUNTER, true);
    const meeting2 = await createMeeting(ctx.userId, Role.ADMIN, true);
    const votation1 = await createVotation(meeting1.id, Status.UPCOMING, 1);
    const votation2 = await createVotation(meeting2.id, Status.UPCOMING, 1);
    await createAlternative(votation1.id, alternative1Text);
    try {
        await ctx.client.request(
            gql`
                mutation DeleteVotations($ids: [String!]!) {
                    deleteVotations(ids: $ids)
                }
            `,
            {
                ids: [votation1.id, votation2.id],
            }
        );
        expect(false).toBeTruthy();
    } catch (error) {
        expect(error.message).toContain('Not Authorised!');
    }
});

it('should cast vote successfully', async () => {
    const meeting = await createMeeting(ctx.userId, Role.PARTICIPANT, true);
    const votation = await createVotation(meeting.id, Status.ONGOING, 1);
    const alternative = await createAlternative(votation.id, alternative1Text);
    await ctx.client.request(
        gql`
            mutation CastVote($alternativeId: String!) {
                castVote(alternativeId: $alternativeId) {
                    alternative {
                        id
                        text
                    }
                }
            }
        `,
        {
            alternativeId: alternative.id,
        }
    );
    const hasVoted = await ctx.prisma.hasVoted.count({
        where: {
            userId: ctx.userId,
            votationId: votation.id,
        },
    });
    expect(hasVoted).toBe(1);
});

it('should not cast vote successfully since votation is not ongoing', async () => {
    const meeting = await createMeeting(ctx.userId, Role.PARTICIPANT, true);
    const votation = await createVotation(meeting.id, 'ENDED', 1);
    const alternative = await createAlternative(votation.id, alternative1Text);
    try {
        await ctx.client.request(
            gql`
                mutation CastVote($alternativeId: String!) {
                    castVote(alternativeId: $alternativeId) {
                        alternative {
                            id
                            text
                        }
                    }
                }
            `,
            {
                alternativeId: alternative.id,
            }
        );
        expect(false).toBeTruthy();
    } catch (error) {
        // TODO: Check for correct error message
        const hasVoted = await ctx.prisma.hasVoted.count({
            where: {
                userId: ctx.userId,
                votationId: votation.id,
            },
        });
        expect(hasVoted).toBe(0);
    }
});

it('should not cast vote successfully since user is not participant', async () => {
    const meetingOwner = await ctx.prisma.user.create({
        data: {
            email: 'e@mail.com',
            password: 'password',
        },
    });
    const meeting = await createMeeting(meetingOwner.id, Role.ADMIN, true);
    const votation = await createVotation(meeting.id, Status.ONGOING, 1);
    const alternative = await createAlternative(votation.id, alternative1Text);
    try {
        await ctx.client.request(
            gql`
                mutation CastVote($alternativeId: String!) {
                    castVote(alternativeId: $alternativeId) {
                        alternative {
                            id
                            text
                        }
                    }
                }
            `,
            {
                alternativeId: alternative.id,
            }
        );
        expect(false).toBeTruthy();
    } catch (error) {
        // TODO: Check for correct error message
        const hasVoted = await ctx.prisma.hasVoted.count({
            where: {
                userId: ctx.userId,
                votationId: votation.id,
            },
        });
        expect(hasVoted).toBe(0);
    }
});

it('should not cast vote successfully since user has already voted', async () => {
    const meeting = await createMeeting(ctx.userId, Role.ADMIN, true);
    const votation = await createVotation(meeting.id, Status.ONGOING, 1);
    const alternative = await createAlternative(votation.id, alternative1Text);
    await ctx.prisma.hasVoted.create({
        data: {
            votationId: votation.id,
            userId: ctx.userId,
        },
    });
    try {
        await ctx.client.request(
            gql`
                mutation CastVote($alternativeId: String!) {
                    castVote(alternativeId: $alternativeId) {
                        alternative {
                            id
                            text
                        }
                    }
                }
            `,
            {
                alternativeId: alternative.id,
            }
        );
        expect(false).toBeTruthy();
    } catch (error) {
        // TODO: Check for correct error message
        const hasVoted = await ctx.prisma.hasVoted.count({
            where: {
                userId: ctx.userId,
                votationId: votation.id,
            },
        });
        expect(hasVoted).toBe(1);
    }
});

it('should not cast vote successfully since the participant is not votingEligible', async () => {
    const meeting = await createMeeting(ctx.userId, Role.ADMIN, false);
    const votation = await createVotation(meeting.id, Status.ONGOING, 1);
    const alternative = await createAlternative(votation.id, alternative1Text);
    await ctx.prisma.hasVoted.create({
        data: {
            votationId: votation.id,
            userId: ctx.userId,
        },
    });
    try {
        await ctx.client.request(
            gql`
                mutation CastVote($alternativeId: String!) {
                    castVote(alternativeId: $alternativeId) {
                        alternative {
                            id
                            text
                        }
                    }
                }
            `,
            {
                alternativeId: alternative.id,
            }
        );
        expect(false).toBeTruthy();
    } catch (error) {
        // TODO: Check for correct error message
        const hasVoted = await ctx.prisma.hasVoted.count({
            where: {
                userId: ctx.userId,
                votationId: votation.id,
            },
        });
        expect(hasVoted).toBe(1);
    }
});
