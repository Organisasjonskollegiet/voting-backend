import { createTestContext } from '../../../lib/tests/testContext';
import { gql } from 'graphql-request';
import { Role, MeetingStatus } from '.prisma/client';
import casual from 'casual';
import { CreateMeetingInput } from '../mutation';
import { prisma } from '@prisma/client';
import { queryField } from 'nexus';
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
            hiddenVotes: true,
            type: 'QUALIFIED',
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
    const invite = await ctx.prisma.invite.findUnique({
        where: {
            email_meetingId: {
                email: inviteEmail,
                meetingId: meeting.id,
            },
        },
    });
    expect(newParticipant?.role).toBe(participantRole);
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

it('should update participant successfully', async () => {
    const meeting = await createMeeting(ctx.userId, 'ADMIN');
    const user = await createUser();
    await createParticipant(meeting.id, user.id, Role.PARTICIPANT);
    const participantInput = {
        email: user.email,
        role: Role.COUNTER,
        isVotingEligible: false,
    };
    const response = await ctx.client.request(
        gql`
            mutation UpdateParticipant($meetingId: String!, $participant: ParticipantInput!) {
                updateParticipant(meetingId: $meetingId, participant: $participant) {
                    email
                    role
                    isVotingEligible
                }
            }
        `,
        {
            meetingId: meeting.id,
            participant: participantInput,
        }
    );
    expect(response.updateParticipant).toEqual(participantInput);
});

it('should update participant successfully', async () => {
    const meeting = await createMeeting(ctx.userId, 'ADMIN');
    const email = casual.email;
    await ctx.prisma.invite.create({
        data: {
            meetingId: meeting.id,
            email,
            isVotingEligible: true,
            role: Role.PARTICIPANT,
        },
    });
    const inviteInput = {
        email,
        role: Role.COUNTER,
        isVotingEligible: false,
    };
    const response = await ctx.client.request(
        gql`
            mutation UpdateParticipant($meetingId: String!, $participant: ParticipantInput!) {
                updateParticipant(meetingId: $meetingId, participant: $participant) {
                    email
                    role
                    isVotingEligible
                }
            }
        `,
        {
            meetingId: meeting.id,
            participant: inviteInput,
        }
    );
    expect(response.updateParticipant).toEqual(inviteInput);
});

it('should return Not authorised trying to update participant', async () => {
    const meeting = await createMeeting(ctx.userId, Role.COUNTER);
    const user = await createUser();
    await createParticipant(meeting.id, user.id, Role.PARTICIPANT);
    const participantInput = {
        email: user.email,
        role: Role.COUNTER,
        isVotingEligible: false,
    };
    try {
        await ctx.client.request(
            gql`
                mutation UpdateParticipant($meetingId: String!, $participant: ParticipantInput!) {
                    updateParticipant(meetingId: $meetingId, participant: $participant) {
                        email
                        role
                        isVotingEligible
                    }
                }
            `,
            {
                meetingId: meeting.id,
                participant: participantInput,
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
    const invite = await ctx.prisma.invite.create({
        data: {
            email: casual.email,
            isVotingEligible: true,
            meetingId: meeting.id,
            role: Role.ADMIN,
        },
    });
    await createParticipant(meeting.id, otherUser.id, 'ADMIN');
    const deleteParticipants = await ctx.client.request(
        gql`
            mutation DeleteParticipant($meetingId: String!, $emails: [String!]!) {
                deleteParticipants(meetingId: $meetingId, emails: $emails)
            }
        `,
        {
            meetingId: meeting.id,
            emails: [invite.email, otherUser.email],
        }
    );
    expect(deleteParticipants.deleteParticipants.includes(invite.email)).toBeTruthy();
    expect(deleteParticipants.deleteParticipants.includes(otherUser.email)).toBeTruthy();
});

it('should return OwnerCannotBeRemovedFromParticipantError', async () => {
    const meeting = await createMeeting(ctx.userId, 'ADMIN');
    const user = await ctx.prisma.user.findUnique({
        where: {
            id: ctx.userId,
        },
    });
    const deleteParticipants = await ctx.client.request(
        gql`
            mutation DeleteParticipant($meetingId: String!, $emails: [String!]!) {
                deleteParticipants(meetingId: $meetingId, emails: $emails)
            }
        `,
        {
            meetingId: meeting.id,
            emails: [user?.email],
        }
    );
    expect(deleteParticipants.deleteParticipants).toEqual([]);
    const participantCount = await ctx.prisma.participant.count({
        where: {
            userId: ctx.userId,
            meetingId: meeting.id,
        },
    });
    expect(participantCount).toBe(1);
});

it('should return Not Authorised when deleting participant', async () => {
    const user = await ctx.prisma.user.findUnique({
        where: {
            id: ctx.userId,
        },
    });
    const otherUser = await createUser();
    const meeting = await createMeeting(otherUser.id, 'ADMIN');
    await createParticipant(meeting.id, user!.id, 'COUNTER');
    try {
        await ctx.client.request(
            gql`
                mutation DeleteParticipant($meetingId: String!, $emails: [String!]!) {
                    deleteParticipants(meetingId: $meetingId, emails: $emails)
                }
            `,
            {
                meetingId: meeting.id,
                emails: [user!.email],
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

it('should return correct participants and invitations', async () => {
    const ctxUserRole = Role.ADMIN;
    const meeting = await createMeeting(ctx.userId, ctxUserRole);
    const ctxUser = await ctx.prisma.user.findUnique({
        where: {
            id: ctx.userId,
        },
    });
    if (!ctxUser) throw new Error();
    const user1 = await createUser();
    const participant1 = await createParticipant(meeting.id, user1.id, Role.PARTICIPANT);
    const invite = await ctx.prisma.invite.create({
        data: {
            meetingId: meeting.id,
            email: casual.email,
            role: Role.COUNTER,
            isVotingEligible: true,
        },
    });
    const response = await ctx.client.request(
        gql`
            query GetParticipants($meetingId: String!) {
                participants(meetingId: $meetingId) {
                    email
                    role
                    isVotingEligible
                }
            }
        `,
        {
            meetingId: meeting.id,
        }
    );
    const participants = response.participants;
    expect(participants).toEqual(
        expect.arrayContaining([
            {
                email: user1.email,
                role: participant1.role,
                isVotingEligible: participant1.isVotingEligible,
            },
            {
                email: ctxUser.email,
                role: ctxUserRole,
                isVotingEligible: true,
            },
            {
                email: invite.email,
                role: invite.role,
                isVotingEligible: invite.isVotingEligible,
            },
        ])
    );
});

it('should return not Authorised', async () => {
    const ctxUserRole = Role.COUNTER;
    const meeting = await createMeeting(ctx.userId, ctxUserRole);
    try {
        await ctx.client.request(
            gql`
                query GetParticipants($meetingId: String!) {
                    participants(meetingId: $meetingId) {
                        email
                        role
                        isVotingEligible
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

it('should return the logged in participant', async () => {
    const meeting = await createMeeting(ctx.userId, Role.ADMIN);
    const response = await ctx.client.request(
        gql`
            query GetParticipant($meetingId: String!) {
                myParticipant(meetingId: $meetingId) {
                    role
                    isVotingEligible
                }
            }
        `,
        {
            meetingId: meeting.id,
        }
    );
    console.log(response);
    expect(response.myParticipant.role).toBe(Role.ADMIN);
    expect(response.myParticipant.isVotingEligible).toBe(true);
});

it('should not authorised trying to get my participant if user is not participant', async () => {
    const user = await createUser();
    const meeting = await createMeeting(user.id, Role.ADMIN);
    try {
        await ctx.client.request(
            gql`
                query GetParticipant($meetingId: String!) {
                    myParticipant(meetingId: $meetingId) {
                        role
                        isVotingEligible
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
