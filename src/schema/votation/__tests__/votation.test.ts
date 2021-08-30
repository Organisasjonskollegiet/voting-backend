import { createTestContext } from '../../../lib/tests/testContext';
import { gql } from 'graphql-request';
import { VotationStatus, MeetingStatus, VotationType, Role } from '.prisma/client';
import { string, uuid } from 'casual';
import casual from 'casual';
import { computeResult, setWinner } from '../utils';
import { Vote } from '@prisma/client';
const ctx = createTestContext();

interface StaticMeetingDataType {
    organization: string;
    title: string;
    startTime: string;
    description: string;
    status: MeetingStatus;
}

interface StaticVotationDataType {
    title: string;
    description: string;
    blankVotes: boolean;
    hiddenVotes: boolean;
    type?: VotationType;
    numberOfWinners: number;
    majorityThreshold?: number;
}

const staticMeetingData: StaticMeetingDataType = {
    organization: 'organization',
    title: 'test title',
    startTime: '2021-04-13T11:29:58.000Z',
    description: 'test description',
    status: MeetingStatus.UPCOMING,
};

const staticVotationData: StaticVotationDataType = {
    title: 'test votation title',
    description: 'test votation description',
    blankVotes: true,
    hiddenVotes: true,
    numberOfWinners: 1,
};

const updatedStaticVotationData: StaticVotationDataType = {
    title: 'updated votation title',
    description: 'updated votation description',
    blankVotes: false,
    hiddenVotes: false,
    type: VotationType.QUALIFIED,
    numberOfWinners: 1,
    majorityThreshold: 67,
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

const createVotation = async (
    meetingId: string,
    status: VotationStatus,
    index: number,
    type: VotationType = VotationType.SIMPLE,
    numberOfWinners: number = 1,
    majorityThreshold: number = 66
) => {
    return await ctx.prisma.votation.create({
        data: {
            ...staticVotationData,
            type,
            majorityThreshold,
            status: status,
            index,
            meetingId,
            numberOfWinners,
        },
    });
};

const createAlternative = async (votationId: string, text: string, isWinner?: boolean) => {
    return ctx.prisma.alternative.create({
        data: {
            text,
            votationId,
            isWinner,
        },
    });
};

const createUser = async () => {
    return await ctx.prisma.user.create({
        data: {
            email: casual.email,
            password: casual.password,
        },
    });
};

const createParticipant = async (meetingId: string, userId: string, isVotingEligible: boolean, role: Role) => {
    return await ctx.prisma.participant.create({
        data: {
            meetingId,
            userId,
            isVotingEligible,
            role,
        },
    });
};

const vote = async (votationId: string, userId: string, alternativeId: string) => {
    await ctx.prisma.hasVoted.create({
        data: {
            votationId,
            userId,
        },
    });
    await ctx.prisma.vote.create({
        data: {
            alternativeId,
        },
    });
};

const castStvVote = async (votationId: string, alternatives: { id: string; ranking: number }[], userId: string) => {
    const stv = await ctx.prisma.stvVote.create({
        data: {
            votationId,
        },
    });
    await ctx.prisma.hasVoted.create({
        data: {
            userId,
            votationId,
        },
    });
    const promises: Promise<Vote>[] = [];
    alternatives.forEach((a) =>
        promises.push(
            new Promise(async (resolve, reject) => {
                try {
                    const vote = await ctx.prisma.vote.create({
                        data: {
                            stvVoteId: stv.id,
                            alternativeId: a.id,
                            ranking: a.ranking,
                        },
                    });
                    resolve(vote);
                } catch (error) {
                    reject(error);
                }
            })
        )
    );
    return await Promise.all(promises);
};

const formatVotationToCompare = (votation: any) => {
    return {
        title: votation.title,
        description: votation.description,
        blankVotes: votation.blankVotes,
        hiddenVotes: votation.hiddenVotes,
        type: votation.type,
        majorityThreshold: votation.majorityThreshold,
        index: votation.index,
    };
};

it('should return votation by id', async () => {
    const meeting = await createMeeting(ctx.userId, Role.COUNTER, true);
    const votation = await createVotation(meeting.id, VotationStatus.UPCOMING, 1);
    const votationId = votation.id;
    const getVotation = await ctx.client.request(
        gql`
            query GetVotationById($votationId: String!) {
                votationById(votationId: $votationId) {
                    id
                    title
                    description
                    blankVotes
                    hiddenVotes
                    type
                    numberOfWinners
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
        type: VotationType.SIMPLE,
        majorityThreshold: 66,
        meetingId: meeting.id,
    });
});

it('should throw error from votation by id', async () => {
    const meeting = await createMeeting(ctx.userId, Role.COUNTER, true);
    await createVotation(meeting.id, VotationStatus.UPCOMING, 1);
    try {
        await ctx.client.request(
            gql`
                query GetVotationById($votationId: String!) {
                    votationById(votationId: $votationId) {
                        id
                        title
                        description
                        blankVotes
                        type
                        numberOfWinners
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
    const votation = await createVotation(meeting.id, VotationStatus.UPCOMING, 1);
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
    expect({ ...getAlternatives.alternativesByVotation[0], isWinner: false }).toEqual(alternative1);
    expect({ ...getAlternatives.alternativesByVotation[1], isWinner: false }).toEqual(alternative2);
});

it('should return not authorized', async () => {
    const otherUser = await ctx.prisma.user.create({
        data: {
            email: 'test@example.com',
            password: 'hash',
        },
    });
    const meeting = await createMeeting(otherUser.id, Role.COUNTER, true);
    const votation = await createVotation(meeting.id, VotationStatus.UPCOMING, 1);
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
                type: VotationType.SIMPLE,
                majorityThreshold: 66,
                index: 1,
                alternatives: ['alternative1', 'alternative2'],
            },
            {
                ...staticVotationData,
                type: VotationType.SIMPLE,
                majorityThreshold: 66,
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
                    type
                    majorityThreshold
                    numberOfWinners
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
    const votation1 = await createVotation(meeting.id, VotationStatus.UPCOMING, 1);
    const alternative1 = await createAlternative(votation1.id, 'alternative1');
    const alternative2 = await createAlternative(votation1.id, 'alternative2');
    const votation2 = await createVotation(meeting.id, VotationStatus.UPCOMING, 2);
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
    const meeting = await createMeeting(ctx.userId, Role.COUNTER, true);
    const votation1 = await createVotation(meeting.id, VotationStatus.UPCOMING, 1);
    const alternative1 = await createAlternative(votation1.id, 'alternative1');
    const alternative2 = await createAlternative(votation1.id, 'alternative2');
    const votation2 = await createVotation(meeting.id, VotationStatus.UPCOMING, 2);
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
    } catch (error) {
        expect(error.message).toContain('Not Authorised!');
    }
});

it('should update votation status successfully', async () => {
    const meeting = await createMeeting(ctx.userId, Role.ADMIN, true);
    const votation = await createVotation(meeting.id, VotationStatus.UPCOMING, 1);
    const newStatus = VotationStatus.OPEN;
    const updateVotationStatus = await ctx.client.request(
        gql`
            mutation UpdateVotationStatus($id: String!, $status: VotationStatus!) {
                updateVotationStatus(id: $id, status: $status) {
                    __typename
                    ... on Votation {
                        id
                        status
                    }
                    ... on MaxOneOpenVotationError {
                        message
                    }
                }
            }
        `,
        {
            id: votation.id,
            status: newStatus,
        }
    );
    expect(updateVotationStatus.updateVotationStatus.__typename).toBe('Votation');
    expect(updateVotationStatus.updateVotationStatus.status).toBe(newStatus);
});

it('should return MaxOneOpenVotationStatus trying to open votation', async () => {
    const meeting = await createMeeting(ctx.userId, Role.ADMIN, true);
    await createVotation(meeting.id, VotationStatus.OPEN, 1);
    const votation = await createVotation(meeting.id, VotationStatus.UPCOMING, 2);
    const updateVotationStatus = await ctx.client.request(
        gql`
            mutation UpdateVotationStatus($id: String!, $status: VotationStatus!) {
                updateVotationStatus(id: $id, status: $status) {
                    __typename
                    ... on Votation {
                        id
                        status
                    }
                    ... on MaxOneOpenVotationError {
                        message
                    }
                }
            }
        `,
        {
            id: votation.id,
            status: VotationStatus.OPEN,
        }
    );
    expect(updateVotationStatus.updateVotationStatus.__typename).toBe('MaxOneOpenVotationError');
});

it('should return Not Authorised trying to update votation status', async () => {
    const meeting = await createMeeting(ctx.userId, Role.COUNTER, true);
    const votation = await createVotation(meeting.id, VotationStatus.UPCOMING, 1);
    const newStatus = VotationStatus.OPEN;
    try {
        await ctx.client.request(
            gql`
                mutation UpdateVotationStatus($id: String!, $status: VotationStatus!) {
                    updateVotationStatus(id: $id, status: $status) {
                        __typename
                        ... on Votation {
                            id
                            status
                        }
                        ... on MaxOneOpenVotationError {
                            message
                        }
                    }
                }
            `,
            {
                id: votation.id,
                status: newStatus,
            }
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
                type: VotationType.SIMPLE,
                majorityThreshold: 66,
                index: 1,
                alternatives: [],
            },
            {
                ...staticVotationData,
                type: VotationType.SIMPLE,
                majorityThreshold: 66,
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
                        type
                        majorityThreshold
                        numberOfWinners
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
    const votation = await createVotation(meeting.id, VotationStatus.UPCOMING, 1);
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
    const votation = await createVotation(meeting.id, VotationStatus.UPCOMING, 1);
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
    const votation = await createVotation(meeting.id, VotationStatus.UPCOMING, 1);
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
    const votation1 = await createVotation(meeting.id, VotationStatus.UPCOMING, 1);
    const votation2 = await createVotation(meeting.id, VotationStatus.UPCOMING, 2);
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
    const votation1 = await createVotation(meeting1.id, VotationStatus.UPCOMING, 1);
    const votation2 = await createVotation(meeting2.id, VotationStatus.UPCOMING, 1);
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
    const votation1 = await createVotation(meeting1.id, VotationStatus.UPCOMING, 1);
    const votation2 = await createVotation(meeting2.id, VotationStatus.UPCOMING, 1);
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
    const votation = await createVotation(meeting.id, VotationStatus.OPEN, 1);
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
    const votation = await createVotation(meeting.id, VotationStatus.CHECKING_RESULT, 1);
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
    const votation = await createVotation(meeting.id, VotationStatus.OPEN, 1);
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
    const votation = await createVotation(meeting.id, VotationStatus.OPEN, 1);
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
    const votation = await createVotation(meeting.id, VotationStatus.OPEN, 1);
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

it('should return correct vote count', async () => {
    const meeting = await createMeeting(ctx.userId, Role.ADMIN, true);
    const user1 = await createUser();
    const user2 = await createUser();
    await createParticipant(meeting.id, user1.id, true, Role.PARTICIPANT);
    await createParticipant(meeting.id, user2.id, false, Role.PARTICIPANT);
    const votation1 = await createVotation(meeting.id, VotationStatus.OPEN, 1);
    const votation2 = await createVotation(meeting.id, VotationStatus.OPEN, 1);
    const alternativeForVotation1 = await createAlternative(votation1.id, alternative1Text);
    const alternativeForVotation2 = await createAlternative(votation2.id, alternative1Text);
    await vote(votation1.id, ctx.userId, alternativeForVotation1.id);
    await vote(votation1.id, user1.id, alternativeForVotation1.id);
    await vote(votation2.id, user1.id, alternativeForVotation2.id);
    const voteCount = await ctx.client.request(
        gql`
            query GetVoteCount($votationId: String!) {
                getVoteCount(votationId: $votationId) {
                    votingEligibleCount
                    voteCount
                }
            }
        `,
        {
            votationId: votation1.id,
        }
    );
    expect(voteCount.getVoteCount.votingEligibleCount).toEqual(2);
    expect(voteCount.getVoteCount.voteCount).toEqual(2);
});

it('should return not authorised', async () => {
    const user1 = await createUser();
    const meeting = await createMeeting(user1.id, Role.ADMIN, false);
    const votation = await createVotation(meeting.id, VotationStatus.OPEN, 1);
    const alternative = await createAlternative(votation.id, alternative1Text);
    await vote(votation.id, user1.id, alternative.id);
    try {
        const response = await ctx.client.request(
            gql`
                query GetVoteCount($votationId: String!) {
                    getVoteCount(votationId: $votationId) {
                        votingEligibleCount
                        voteCount
                    }
                }
            `,
            {
                votationId: votation.id,
            }
        );
        expect(true).toBeFalsy();
    } catch (error) {
        expect(error.message).toContain('Not Authorised!');
    }
});

it('should return alternative1 as winner with simple majority', async () => {
    const user1 = await createUser();
    const user2 = await createUser();
    const meeting = await createMeeting(ctx.userId, Role.ADMIN, true);
    await createParticipant(meeting.id, user1.id, true, Role.PARTICIPANT);
    await createParticipant(meeting.id, user2.id, true, Role.PARTICIPANT);
    const votation = await createVotation(meeting.id, VotationStatus.CHECKING_RESULT, 1, VotationType.SIMPLE);
    const alternative1 = await createAlternative(votation.id, alternative1Text);
    const alternative2 = await createAlternative(votation.id, alternative2Text);
    await vote(votation.id, ctx.userId, alternative1.id);
    await vote(votation.id, user1.id, alternative1.id);
    await vote(votation.id, user2.id, alternative2.id);
    await setWinner(ctx, votation.id);
    const response = await ctx.client.request(
        gql`
            query GetVotationResults($id: String!) {
                getVotationResults(id: $id) {
                    alternatives {
                        id
                        text
                        votationId
                        isWinner
                        votes
                    }
                    votingEligibleCount
                    voteCount
                }
            }
        `,
        {
            id: votation.id,
        }
    );
    expect(response.getVotationResults.alternatives).toEqual(
        expect.arrayContaining([
            {
                ...alternative1,
                isWinner: true,
                votes: 2,
            },
            {
                ...alternative2,
                isWinner: false,
                votes: 1,
            },
        ])
    );
    expect(response.getVotationResults.votingEligibleCount).toEqual(3);
    expect(response.getVotationResults.voteCount).toEqual(3);
});

it('should return no winner with simple majority when the alternatives has equal amount of votes', async () => {
    const user1 = await createUser();
    const meeting = await createMeeting(ctx.userId, Role.ADMIN, true);
    await createParticipant(meeting.id, user1.id, true, Role.PARTICIPANT);
    const votation = await createVotation(meeting.id, VotationStatus.CHECKING_RESULT, 1, VotationType.SIMPLE);
    const alternative1 = await createAlternative(votation.id, alternative1Text);
    const alternative2 = await createAlternative(votation.id, alternative2Text);
    await vote(votation.id, ctx.userId, alternative1.id);
    await vote(votation.id, user1.id, alternative2.id);
    await setWinner(ctx, votation.id);
    const response = await ctx.client.request(
        gql`
            query GetVotationResults($id: String!) {
                getVotationResults(id: $id) {
                    alternatives {
                        id
                        text
                        votationId
                        isWinner
                        votes
                    }
                    votingEligibleCount
                    voteCount
                }
            }
        `,
        {
            id: votation.id,
        }
    );
    expect(response.getVotationResults.alternatives).toEqual(
        expect.arrayContaining([
            {
                ...alternative1,
                isWinner: false,
                votes: 1,
            },
            {
                ...alternative2,
                isWinner: false,
                votes: 1,
            },
        ])
    );
    expect(response.getVotationResults.votingEligibleCount).toEqual(2);
    expect(response.getVotationResults.voteCount).toEqual(2);
});

it('should return alternative1 as winner with qualified over 66%', async () => {
    const user1 = await createUser();
    const user2 = await createUser();
    const meeting = await createMeeting(ctx.userId, Role.ADMIN, true);
    await createParticipant(meeting.id, user1.id, true, Role.PARTICIPANT);
    await createParticipant(meeting.id, user2.id, true, Role.PARTICIPANT);
    const votation = await createVotation(meeting.id, VotationStatus.CHECKING_RESULT, 1, VotationType.QUALIFIED, 1, 66);
    const alternative1 = await createAlternative(votation.id, alternative1Text);
    const alternative2 = await createAlternative(votation.id, alternative2Text);
    await vote(votation.id, ctx.userId, alternative1.id);
    await vote(votation.id, user1.id, alternative1.id);
    await vote(votation.id, user2.id, alternative2.id);
    await setWinner(ctx, votation.id);
    const response = await ctx.client.request(
        gql`
            query GetVotationResults($id: String!) {
                getVotationResults(id: $id) {
                    alternatives {
                        id
                        text
                        votationId
                        isWinner
                        votes
                    }
                    votingEligibleCount
                    voteCount
                }
            }
        `,
        {
            id: votation.id,
        }
    );
    expect(response.getVotationResults.alternatives).toEqual(
        expect.arrayContaining([
            {
                ...alternative1,
                isWinner: true,
                votes: 2,
            },
            {
                ...alternative2,
                isWinner: false,
                votes: 1,
            },
        ])
    );
    expect(response.getVotationResults.votingEligibleCount).toEqual(3);
    expect(response.getVotationResults.voteCount).toEqual(3);
});

it('should return no winner with qualified over 67%', async () => {
    const user1 = await createUser();
    const user2 = await createUser();
    const meeting = await createMeeting(ctx.userId, Role.COUNTER, true);
    await createParticipant(meeting.id, user1.id, true, Role.PARTICIPANT);
    await createParticipant(meeting.id, user2.id, true, Role.PARTICIPANT);
    const votation = await createVotation(meeting.id, VotationStatus.CHECKING_RESULT, 1, VotationType.QUALIFIED, 1, 67);
    const alternative1 = await createAlternative(votation.id, alternative1Text);
    const alternative2 = await createAlternative(votation.id, alternative2Text);
    await vote(votation.id, ctx.userId, alternative1.id);
    await vote(votation.id, user1.id, alternative1.id);
    await vote(votation.id, user2.id, alternative2.id);
    await setWinner(ctx, votation.id);
    const response = await ctx.client.request(
        gql`
            query GetVotationResults($id: String!) {
                getVotationResults(id: $id) {
                    alternatives {
                        id
                        text
                        votationId
                        isWinner
                        votes
                    }
                    votingEligibleCount
                    voteCount
                }
            }
        `,
        {
            id: votation.id,
        }
    );
    expect(response.getVotationResults.alternatives).toEqual(
        expect.arrayContaining([
            {
                ...alternative1,
                isWinner: false,
                votes: 2,
            },
            {
                ...alternative2,
                isWinner: false,
                votes: 1,
            },
        ])
    );
    expect(response.getVotationResults.votingEligibleCount).toEqual(3);
    expect(response.getVotationResults.voteCount).toEqual(3);
});

it('should return not authorised trying to get votation results', async () => {
    const meeting = await createMeeting(ctx.userId, Role.PARTICIPANT, true);
    const votation = await createVotation(meeting.id, VotationStatus.CHECKING_RESULT, 1, VotationType.QUALIFIED, 1, 67);
    const alternative1 = await createAlternative(votation.id, alternative1Text);
    await vote(votation.id, ctx.userId, alternative1.id);
    await setWinner(ctx, votation.id);
    try {
        await ctx.client.request(
            gql`
                query GetVotationResults($id: String!) {
                    getVotationResults(id: $id) {
                        alternatives {
                            id
                            text
                            votationId
                            isWinner
                            votes
                        }
                        votingEligibleCount
                        voteCount
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

it('should return votation id with results (alternative with isWinner) for all votatons of meeting', async () => {
    const meeting = await createMeeting(ctx.userId, Role.PARTICIPANT, true);
    const publishedVotation = await createVotation(meeting.id, VotationStatus.PUBLISHED_RESULT, 1);
    await createVotation(meeting.id, VotationStatus.CHECKING_RESULT, 1);
    const winner = await createAlternative(publishedVotation.id, casual.title, true);
    const loser = await createAlternative(publishedVotation.id, casual.title, false);
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
    const otherUser = await createUser();
    const meeting = await createMeeting(otherUser.id, Role.PARTICIPANT, true);
    const publishedVotation = await createVotation(meeting.id, VotationStatus.PUBLISHED_RESULT, 1);
    await createAlternative(publishedVotation.id, casual.title, true);
    await createAlternative(publishedVotation.id, casual.title, false);
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
    } catch (error) {
        expect(error.message).toContain('Not Authorised!');
    }
});

it('should return andrea and carter as winners', async () => {
    const meeting = await createMeeting(ctx.userId, Role.ADMIN, true);
    const votation = await createVotation(meeting.id, VotationStatus.PUBLISHED_RESULT, 1, VotationType.STV, 2);
    const andrea = await createAlternative(votation.id, casual.title);
    const brad = await createAlternative(votation.id, casual.title);
    const carter = await createAlternative(votation.id, casual.title);
    const delilah = await createAlternative(votation.id, casual.title);
    const promises: Promise<Vote[]>[] = [];
    for (let i = 0; i < 16; i++) {
        promises.push(
            new Promise(async (resolve, reject) => {
                try {
                    const user = await createUser();
                    const votes = await castStvVote(
                        votation.id,
                        [
                            { id: andrea.id, ranking: 0 },
                            { id: brad.id, ranking: 1 },
                            { id: carter.id, ranking: 2 },
                            { id: delilah.id, ranking: 3 },
                        ],
                        user.id
                    );
                    resolve(votes);
                } catch (error) {
                    reject(error);
                }
            })
        );
    }
    for (let i = 0; i < 24; i++) {
        promises.push(
            new Promise(async (resolve, reject) => {
                try {
                    const user = await createUser();
                    const votes = await castStvVote(
                        votation.id,
                        [
                            { id: andrea.id, ranking: 0 },
                            { id: carter.id, ranking: 1 },
                            { id: brad.id, ranking: 2 },
                            { id: delilah.id, ranking: 3 },
                        ],
                        user.id
                    );
                    resolve(votes);
                } catch (error) {
                    reject(error);
                }
            })
        );
    }
    for (let i = 0; i < 17; i++) {
        promises.push(
            new Promise(async (resolve, reject) => {
                try {
                    const user = await createUser();
                    const votes = await castStvVote(
                        votation.id,
                        [
                            { id: delilah.id, ranking: 0 },
                            { id: andrea.id, ranking: 1 },
                            { id: brad.id, ranking: 2 },
                            { id: carter.id, ranking: 3 },
                        ],
                        user.id
                    );
                    resolve(votes);
                } catch (error) {
                    reject(error);
                }
            })
        );
    }
    await Promise.all(promises);
    const result = await computeResult(ctx, votation);
    expect(result.length).toBe(2);
    expect(result.includes(andrea.id)).toBeTruthy();
    expect(result.includes(carter.id)).toBeTruthy();
});
