import { createTestContext } from '../../../lib/tests/testContext';
import { gql } from 'graphql-request';
import { Role, Status } from '.prisma/client';
const ctx = createTestContext();

interface StaticMeetingDataType {
    title: string;
    startTime: string;
    description: string;
    status: Status;
}

const meetingTitle = 'title';
const meetingStartTime = '2021-04-13T11:45:43.000Z';
const meetingDescription = 'description';
const meetingStatus = 'UPCOMING';
const createMeetingVariables = {
    meeting: {
        title: meetingTitle,
        startTime: meetingStartTime,
        description: meetingDescription,
    },
};

const staticMeetingData: StaticMeetingDataType = {
    title: meetingTitle,
    startTime: meetingStartTime,
    description: meetingDescription,
    status: meetingStatus,
};

const createMeeting = async (ownerId: string, role: Role) => {
    return await ctx.prisma.meeting.create({
        data: {
            ...staticMeetingData,
            ownerId,
            participants: {
                create: {
                    userId: ownerId,
                    role,
                    isVotingEligible: true,
                },
            },
        },
    });
};

it('should create a meeting successfully', async () => {
    const createMeeting = await ctx.client.request(
        gql`
            mutation CreateMeeting($meeting: CreateMeetingInput!) {
                createMeeting(meeting: $meeting) {
                    title
                    description
                    startTime
                    owner {
                        id
                    }
                    participants {
                        role
                        isVotingEligible
                        user {
                            id
                        }
                    }
                }
            }
        `,
        createMeetingVariables
    );
    const meeting = createMeeting.createMeeting;
    expect(meeting).toEqual({
        ...createMeetingVariables.meeting,
        owner: {
            id: ctx.userId,
        },
        participants: [
            {
                role: 'ADMIN',
                isVotingEligible: true,
                user: {
                    id: ctx.userId,
                },
            },
        ],
    });
});

it('should return meetings where you are admin successfully', async () => {
    const meeting = await createMeeting(ctx.userId, 'ADMIN');
    const getMeetings = await ctx.client.request(
        gql`
            query GetMeetings {
                meetings {
                    id
                    title
                    description
                    startTime
                    status
                    owner {
                        id
                    }
                }
            }
        `
    );
    const meetings = getMeetings.meetings;
    expect(meetings[0]).toEqual({
        id: meeting.id,
        title: meeting.title,
        startTime: meetingStartTime,
        status: meeting.status,
        description: meeting.description,
        owner: {
            id: meeting.ownerId,
        },
    });
});

it('should return meetings where you are counter successfully', async () => {
    const meeting = await createMeeting(ctx.userId, 'COUNTER');
    const getMeetings = await ctx.client.request(
        gql`
            query GetMeetings {
                meetings {
                    id
                    title
                    description
                    startTime
                    status
                    owner {
                        id
                    }
                }
            }
        `
    );
    const meetings = getMeetings.meetings;
    expect(meetings[0]).toEqual({
        id: meeting.id,
        title: meeting.title,
        startTime: meetingStartTime,
        status: meeting.status,
        description: meeting.description,
        owner: {
            id: meeting.ownerId,
        },
    });
});

it('should return meetings where you are participant successfully', async () => {
    const meeting = await createMeeting(ctx.userId, 'PARTICIPANT');
    const getMeetings = await ctx.client.request(
        gql`
            query GetMeetings {
                meetings {
                    id
                    title
                    description
                    startTime
                    status
                    owner {
                        id
                    }
                }
            }
        `
    );
    const meetings = getMeetings.meetings;
    expect(meetings[0]).toEqual({
        id: meeting.id,
        title: meeting.title,
        startTime: meetingStartTime,
        status: meeting.status,
        description: meeting.description,
        owner: {
            id: meeting.ownerId,
        },
    });
});

it('should not return meetings where you are not participating', async () => {
    const ownerId = ctx.userId;
    await ctx.prisma.meeting.create({
        data: {
            ...staticMeetingData,
            ownerId,
        },
    });
    const getMeetings = await ctx.client.request(
        gql`
            query GetMeetings {
                meetings {
                    id
                    title
                    description
                    startTime
                    status
                    owner {
                        id
                    }
                }
            }
        `
    );
    const meetings = getMeetings.meetings;
    expect(meetings.length).toEqual(0);
});

it('should return a meeting by id successfully', async () => {
    const meeting = await createMeeting(ctx.userId, 'ADMIN');
    const getMeeting = await ctx.client.request(
        gql`
            query GetMeetingsById($meetingId: String!) {
                meetingsById(meetingId: $meetingId) {
                    id
                    title
                    description
                    startTime
                    status
                    owner {
                        id
                    }
                }
            }
        `,
        {
            meetingId: meeting.id,
        }
    );
    const meetingResult = getMeeting.meetingsById;
    expect(meetingResult).toEqual({
        id: meeting.id,
        title: meeting.title,
        startTime: meetingStartTime,
        status: meeting.status,
        description: meeting.description,
        owner: {
            id: meeting.ownerId,
        },
    });
});

it('should update meeting successfully', async () => {
    const updatedTitle = 'new title';
    const updatedStartTime = '2021-05-13T14:06:30.000Z';
    const updatedDescription = 'New description';
    const updatedStatus = 'ONGOING';
    const updatedInfo = {
        title: updatedTitle,
        startTime: updatedStartTime,
        description: updatedDescription,
        status: updatedStatus,
    };
    const meeting = await createMeeting(ctx.userId, 'ADMIN');
    const updatedMeeting = await ctx.client.request(
        gql`
            mutation UpdateMeeting($meeting: UpdateMeetingInput!) {
                updateMeeting(meeting: $meeting) {
                    id
                    title
                    description
                    startTime
                    status
                }
            }
        `,
        {
            meeting: {
                id: meeting.id,
                ...updatedInfo,
            },
        }
    );
    expect(updatedMeeting.updateMeeting).toEqual({
        id: meeting.id,
        ...updatedInfo,
    });
});

// Double check this
it('should throw error for not authorized when trying to update meeting', async () => {
    const updatedTitle = 'new title';
    const updatedStartTime = '2021-05-13T14:06:30.000Z';
    const updatedDescription = 'New description';
    const updatedStatus = 'ONGOING';
    const updatedInfo = {
        title: updatedTitle,
        startTime: updatedStartTime,
        description: updatedDescription,
        status: updatedStatus,
    };
    const meeting = await createMeeting(ctx.userId, 'COUNTER');
    expect(async () => {
        await ctx.client.request(
            gql`
                mutation UpdateMeeting($meeting: UpdateMeetingInput!) {
                    updateMeeting(meeting: $meeting) {
                        id
                        title
                        description
                        startTime
                        status
                    }
                }
            `,
            {
                meeting: {
                    id: meeting.id,
                    ...updatedInfo,
                },
            }
        );
    }).rejects.toThrow();
});

it('should delete meeting successfully', async () => {
    const meeting = await createMeeting(ctx.userId, 'ADMIN');
    const votation = await ctx.prisma.votation.create({
        data: {
            title: 'votationTitle',
            description: 'votationDescription',
            blankVotes: true,
            majorityType: 'QUALIFIED',
            majorityThreshold: 60,
            meetingId: meeting.id,
        },
    });
    await ctx.prisma.alternative.create({
        data: {
            text: 'Alternative',
            votationId: votation.id,
        },
    });
    await ctx.client.request(
        gql`
            mutation DeleteMeeting($id: String!) {
                deleteMeeting(id: $id) {
                    id
                }
            }
        `,
        {
            id: meeting.id,
        }
    );
    const numberOfMeetingsWithId = await ctx.prisma.meeting.count({ where: { id: meeting.id } });
    expect(numberOfMeetingsWithId).toBe(0);
});

it('should not delete meeting successfully', async () => {
    const user = await ctx.prisma.user.create({
        data: {
            email: 'e@mail.com',
            password: 'secret',
        },
    });
    const meeting = await createMeeting(user.id, 'ADMIN');
    try {
        await ctx.client.request(
            gql`
                mutation DeleteMeeting($id: String!) {
                    deleteMeeting(id: $id) {
                        id
                    }
                }
            `,
            {
                id: meeting.id,
            }
        );
        expect(false).toBeTruthy();
    } catch (error) {
        expect(error.message).toContain('Not Authorised!');
    }
});

it('should delete participant successfully', async () => {
    const otherUser = await ctx.prisma.user.create({
        data: {
            email: 'e@mail.com',
            password: 'secret',
        },
    });
    const meeting = await createMeeting(ctx.userId, 'ADMIN');
    await ctx.prisma.participant.create({
        data: {
            meetingId: meeting.id,
            userId: otherUser.id,
            role: 'ADMIN',
        },
    });
    await ctx.client.request(
        gql`
            mutation DeleteParticipant($meetingId: String!, $userId: String!) {
                deleteParticipant(meetingId: $meetingId, userId: $userId) {
                    ... on Participant {
                        role
                    }
                    ... on OwnerCannotBeRemovedFromParticipantError {
                        message
                    }
                }
            }
        `,
        {
            meetingId: meeting.id,
            userId: otherUser.id,
        }
    );
    const participantCount = await ctx.prisma.participant.count({
        where: {
            userId: otherUser.id,
            meetingId: meeting.id,
        },
    });
    expect(participantCount).toBe(0);
});

it('should return OwnerCannotBeRemovedFromParticipantError', async () => {
    const meeting = await createMeeting(ctx.userId, 'ADMIN');
    const deleteParticipant = await ctx.client.request(
        gql`
            mutation DeleteParticipant($meetingId: String!, $userId: String!) {
                deleteParticipant(meetingId: $meetingId, userId: $userId) {
                    ... on Participant {
                        role
                    }
                    ... on OwnerCannotBeRemovedFromParticipantError {
                        message
                    }
                }
            }
        `,
        {
            meetingId: meeting.id,
            userId: ctx.userId,
        }
    );
    expect(deleteParticipant.deleteParticipant.message).toEqual(
        'The owner of the meeting cannot be removed from being a participant.'
    );
    const participantCount = await ctx.prisma.participant.count({
        where: {
            userId: ctx.userId,
            meetingId: meeting.id,
        },
    });
    expect(participantCount).toBe(1);
});

it('should return Not Authorised', async () => {
    const otherUser = await ctx.prisma.user.create({
        data: {
            email: 'e@mail.com',
            password: 'secret',
        },
    });
    const meeting = await createMeeting(otherUser.id, 'ADMIN');
    await ctx.prisma.participant.create({
        data: {
            userId: ctx.userId,
            meetingId: meeting.id,
            role: 'COUNTER',
        },
    });
    try {
        await ctx.client.request(
            gql`
                mutation DeleteParticipant($meetingId: String!, $userId: String!) {
                    deleteParticipant(meetingId: $meetingId, userId: $userId) {
                        ... on Participant {
                            role
                        }
                        ... on OwnerCannotBeRemovedFromParticipantError {
                            message
                        }
                    }
                }
            `,
            {
                meetingId: meeting.id,
                userId: ctx.userId,
            }
        );
        expect(false).toBeTruthy();
    } catch (error) {
        expect(error.message).toContain('Not Authorised!');
    }
    const participantCount = await ctx.prisma.participant.count({
        where: {
            userId: ctx.userId,
            meetingId: meeting.id,
        },
    });
    expect(participantCount).toBe(1);
});
