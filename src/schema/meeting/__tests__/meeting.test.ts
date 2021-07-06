import { createTestContext } from '../../../lib/tests/testContext';
import { gql } from 'graphql-request';
import { Role, MeetingStatus } from '.prisma/client';
import casual from 'casual';
const ctx = createTestContext();

interface StaticMeetingDataType {
    title: string;
    organization: string;
    startTime: string;
    description: string;
    status: MeetingStatus;
}

const createMeetingVariables = {
    meeting: {
        title: 'title',
        organization: 'Organisasjonskollegiet',
        startTime: '2021-04-13T11:45:43.000Z',
        description: 'description',
    },
};

const updatedMeetingInfo = {
    title: 'new title',
    organization: 'Junior Consulting AS',
    startTime: '2021-05-13T14:06:30.000Z',
    description: 'New description',
    status: MeetingStatus.ONGOING,
};

const staticMeetingData: StaticMeetingDataType = {
    title: 'title',
    organization: 'Organisasjonskollegiet',
    startTime: '2021-05-13T14:06:30.000Z',
    description: 'description',
    status: MeetingStatus.UPCOMING,
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

const createUser = async () => {
    return await ctx.prisma.user.create({
        data: {
            email: casual.email,
            password: 'secret',
        },
    });
};

const createParticipant = async (meetingId: string, userId: string, role: Role) => {
    return await ctx.prisma.participant.create({
        data: {
            meetingId,
            userId,
            role,
        },
    });
};

it('should create a meeting successfully', async () => {
    const createMeeting = await ctx.client.request(
        gql`
            mutation CreateMeeting($meeting: CreateMeetingInput!) {
                createMeeting(meeting: $meeting) {
                    title
                    organization
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
                    organization
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
        organization: meeting.organization,
        startTime: staticMeetingData.startTime,
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
                    organization
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
        organization: meeting.organization,
        startTime: staticMeetingData.startTime,
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
                    organization
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
        organization: meeting.organization,
        startTime: staticMeetingData.startTime,
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
                    organization
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
            query GetMeetingById($meetingId: String!) {
                meetingById(meetingId: $meetingId) {
                    id
                    title
                    organization
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
    const meetingResult = getMeeting.meetingById;
    expect(meetingResult).toEqual({
        id: meeting.id,
        title: meeting.title,
        organization: meeting.organization,
        startTime: staticMeetingData.startTime,
        status: meeting.status,
        description: meeting.description,
        owner: {
            id: meeting.ownerId,
        },
    });
});

it('should update meeting successfully', async () => {
    const meeting = await createMeeting(ctx.userId, 'ADMIN');
    const updatedMeeting = await ctx.client.request(
        gql`
            mutation UpdateMeeting($meeting: UpdateMeetingInput!) {
                updateMeeting(meeting: $meeting) {
                    id
                    title
                    organization
                    description
                    startTime
                    status
                }
            }
        `,
        {
            meeting: {
                id: meeting.id,
                ...updatedMeetingInfo,
            },
        }
    );
    expect(updatedMeeting.updateMeeting).toEqual({
        id: meeting.id,
        ...updatedMeetingInfo,
    });
});

// Double check this
it('should throw error for not authorized when trying to update meeting', async () => {
    const meeting = await createMeeting(ctx.userId, 'COUNTER');
    try {
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
                    ...updatedMeetingInfo,
                },
            }
        );
        expect(false).toBeTruthy();
    } catch (error) {
        expect(error.message).toContain('Not Authorised!');
    }
});

it('should delete meeting successfully', async () => {
    const meeting = await createMeeting(ctx.userId, 'ADMIN');
    const votation = await ctx.prisma.votation.create({
        data: {
            title: 'votationTitle',
            description: 'votationDescription',
            blankVotes: true,
            severalVotes: true,
            hiddenVotes: true,
            majorityType: 'QUALIFIED',
            majorityThreshold: 60,
            index: 1,
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
    const user = await createUser();
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

it('should add participant and invite successfully', async () => {
    const meeting = await createMeeting(ctx.userId, 'ADMIN');
    const user = await createUser();
    const existingParticipantUser = await createUser();
    const existingParticipant = await createParticipant(meeting.id, existingParticipantUser.id, 'PARTICIPANT');
    const existingParticipantNewRole = 'COUNTER';
    const participantRole = 'ADMIN';
    const inviteEmail = casual.email;
    const inviteRole = 'COUNTER';
    await ctx.client.request(
        gql`
            mutation AddParticipants($meetingId: String!, $participants: [ParticipantInput!]!) {
                addParticipants(meetingId: $meetingId, participants: $participants)
            }
        `,
        {
            meetingId: meeting.id,
            participants: [
                {
                    email: user.email,
                    role: participantRole,
                    isVotingEligible: true,
                },
                {
                    email: inviteEmail,
                    role: inviteRole,
                    isVotingEligible: false,
                },
                {
                    email: existingParticipantUser.email,
                    role: existingParticipantNewRole,
                    isVotingEligible: true,
                },
            ],
        }
    );
    const newParticipant = await ctx.prisma.participant.findUnique({
        where: {
            userId_meetingId: {
                userId: user.id,
                meetingId: meeting.id,
            },
        },
    });
    const existingParticipantUpdated = await ctx.prisma.participant.findUnique({
        where: {
            userId_meetingId: {
                userId: existingParticipantUser.id,
                meetingId: meeting.id,
            },
        },
    });
    const invite = await ctx.prisma.invite.findUnique({
        where: {
            email_meetingId: {
                email: inviteEmail,
                meetingId: meeting.id,
            },
        },
    });
    expect(newParticipant?.role).toBe(participantRole);
    expect(existingParticipantUpdated?.role).toBe(existingParticipantNewRole);
    expect(invite?.role).toBe(inviteRole);
});

it('should return not Authorised trying to add participant and invite ', async () => {
    const meeting = await createMeeting(ctx.userId, 'COUNTER');
    const user = await createUser();
    const participantRole = 'ADMIN';
    const inviteEmail = '2@mail.com';
    const inviteRole = 'COUNTER';
    try {
        await ctx.client.request(
            gql`
                mutation AddParticipants($meetingId: String!, $participants: [ParticipantInput!]!) {
                    addParticipants(meetingId: $meetingId, participants: $participants)
                }
            `,
            {
                meetingId: meeting.id,
                participants: [
                    {
                        email: user.email,
                        role: participantRole,
                        isVotingEligible: true,
                    },
                    {
                        email: inviteEmail,
                        role: inviteRole,
                        isVotingEligible: true,
                    },
                ],
            }
        );
        expect(false).toBeTruthy();
    } catch (error) {
        expect(error.message).toContain('Not Authorised!');
    }
});

it('should delete participant successfully', async () => {
    const otherUser = await createUser();
    const meeting = await createMeeting(ctx.userId, 'ADMIN');
    await createParticipant(meeting.id, otherUser.id, 'ADMIN');
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

it('should return Not Authorised when deleting participant', async () => {
    const otherUser = await createUser();
    const meeting = await createMeeting(otherUser.id, 'ADMIN');
    await createParticipant(meeting.id, ctx.userId, 'COUNTER');
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
