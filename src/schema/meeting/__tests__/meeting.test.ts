import { createTestContext } from '../../../lib/tests/testContext';
import { gql } from 'graphql-request';
const ctx = createTestContext();

// it('should create a meeting successfully', async () => {
//     const title = 'test creation title';
//     const startTime = '2021-04-13T11:45:43.000Z';
//     const description = 'test creation description';
//     const variables = {
//         meeting: {
//             title,
//             startTime,
//             description,
//         },
//     };
//     const createMeeting = await ctx.client.request(
//         gql`
//             mutation CreateMeeting($meeting: CreateMeetingInput!) {
//                 createMeeting(meeting: $meeting) {
//                     title
//                     description
//                     startTime
//                     owner {
//                         id
//                     }
//                     participants {
//                         role
//                         isVotingEligible
//                         user {
//                             id
//                         }
//                     }
//                 }
//             }
//         `,
//         variables
//     );
//     const meeting = createMeeting.createMeeting;
//     expect(meeting).toEqual({
//         ...variables.meeting,
//         owner: {
//             id: ctx.userId,
//         },
//         participants: [
//             {
//                 role: 'ADMIN',
//                 isVotingEligible: true,
//                 user: {
//                     id: ctx.userId,
//                 },
//             },
//         ],
//     });
// });

// it('should return meetings where you are admin successfully', async () => {
//     const title = 'test get meeting';
//     const startTime = '2021-04-13T11:29:58.000Z';
//     const description = 'test get meeting description';
//     const status = 'UPCOMING';
//     const ownerId = ctx.userId;
//     const meeting = await ctx.prisma.meeting.create({
//         data: {
//             title,
//             startTime,
//             description,
//             status,
//             ownerId,
//             participants: {
//                 create: {
//                     userId: ctx.userId,
//                     role: 'ADMIN',
//                     isVotingEligible: true,
//                 },
//             },
//         },
//     });
//     const getMeetings = await ctx.client.request(
//         gql`
//             query GetMeetings {
//                 meetings {
//                     id
//                     title
//                     description
//                     startTime
//                     status
//                     owner {
//                         id
//                     }
//                 }
//             }
//         `
//     );
//     const meetings = getMeetings.meetings;
//     expect(meetings[0]).toEqual({
//         id: meeting.id,
//         title: meeting.title,
//         startTime,
//         status: meeting.status,
//         description: meeting.description,
//         owner: {
//             id: meeting.ownerId,
//         },
//     });
// });

// it('should return meetings where you are counter successfully', async () => {
//     const title = 'test get meeting';
//     const startTime = '2021-04-13T11:29:58.000Z';
//     const description = 'test get meeting description';
//     const status = 'UPCOMING';
//     const ownerId = ctx.userId;
//     const meeting = await ctx.prisma.meeting.create({
//         data: {
//             title,
//             startTime,
//             description,
//             status,
//             ownerId,
//             participants: {
//                 create: {
//                     userId: ctx.userId,
//                     role: 'COUNTER',
//                     isVotingEligible: true,
//                 },
//             },
//         },
//     });
//     const getMeetings = await ctx.client.request(
//         gql`
//             query GetMeetings {
//                 meetings {
//                     id
//                     title
//                     description
//                     startTime
//                     status
//                     owner {
//                         id
//                     }
//                 }
//             }
//         `
//     );
//     const meetings = getMeetings.meetings;
//     expect(meetings[0]).toEqual({
//         id: meeting.id,
//         title: meeting.title,
//         startTime,
//         status: meeting.status,
//         description: meeting.description,
//         owner: {
//             id: meeting.ownerId,
//         },
//     });
// });

// it('should return meetings where you are participant successfully', async () => {
//     const title = 'test get meeting';
//     const startTime = '2021-04-13T11:29:58.000Z';
//     const description = 'test get meeting description';
//     const status = 'UPCOMING';
//     const ownerId = ctx.userId;
//     const meeting = await ctx.prisma.meeting.create({
//         data: {
//             title,
//             startTime,
//             description,
//             status,
//             ownerId,
//             participants: {
//                 create: {
//                     userId: ctx.userId,
//                     role: 'PARTICIPANT',
//                     isVotingEligible: true,
//                 },
//             },
//         },
//     });
//     const getMeetings = await ctx.client.request(
//         gql`
//             query GetMeetings {
//                 meetings {
//                     id
//                     title
//                     description
//                     startTime
//                     status
//                     owner {
//                         id
//                     }
//                 }
//             }
//         `
//     );
//     const meetings = getMeetings.meetings;
//     expect(meetings[0]).toEqual({
//         id: meeting.id,
//         title: meeting.title,
//         startTime,
//         status: meeting.status,
//         description: meeting.description,
//         owner: {
//             id: meeting.ownerId,
//         },
//     });
// });

// it('should not return meetings where you are not participating', async () => {
//     const title = 'test get meeting';
//     const startTime = '2021-04-13T11:29:58.000Z';
//     const description = 'test get meeting description';
//     const status = 'UPCOMING';
//     const ownerId = ctx.userId;
//     const meeting = await ctx.prisma.meeting.create({
//         data: {
//             title,
//             startTime,
//             description,
//             status,
//             ownerId,
//         },
//     });
//     const getMeetings = await ctx.client.request(
//         gql`
//             query GetMeetings {
//                 meetings {
//                     id
//                     title
//                     description
//                     startTime
//                     status
//                     owner {
//                         id
//                     }
//                 }
//             }
//         `
//     );
//     const meetings = getMeetings.meetings;
//     expect(meetings.length).toEqual(0);
// });

// it('should return a meeting by id successfully', async () => {
//     const title = 'test get meeting by id ';
//     const startTime = '2021-04-13T14:06:30.000Z';
//     const description = 'test get meeting by id description';
//     const status = 'UPCOMING';
//     const ownerId = ctx.userId;
//     const meeting = await ctx.prisma.meeting.create({
//         data: {
//             title,
//             startTime,
//             description,
//             status,
//             ownerId,
//             participants: {
//                 create: {
//                     userId: ctx.userId,
//                     role: 'ADMIN',
//                     isVotingEligible: true,
//                 },
//             },
//         },
//     });
//     const getMeeting = await ctx.client.request(
//         gql`
//             query GetMeetingsById($meetingId: String!) {
//                 meetingsById(meetingId: $meetingId) {
//                     id
//                     title
//                     description
//                     startTime
//                     status
//                     owner {
//                         id
//                     }
//                 }
//             }
//         `,
//         {
//             meetingId: meeting.id,
//         }
//     );
//     const meetingResult = getMeeting.meetingsById;
//     expect(meetingResult).toEqual({
//         id: meeting.id,
//         title: meeting.title,
//         startTime,
//         status: meeting.status,
//         description: meeting.description,
//         owner: {
//             id: meeting.ownerId,
//         },
//     });
// });

// it('should update meeting successfully', async () => {
//     const title = 'test get meeting by id ';
//     const startTime = '2021-04-13T14:06:30.000Z';
//     const description = 'test get meeting by id description';
//     const status = 'UPCOMING';
//     const ownerId = ctx.userId;
//     const updatedTitle = 'new title';
//     const updatedStartTime = '2021-05-13T14:06:30.000Z';
//     const updatedDescription = 'New description';
//     const updatedStatus = 'ONGOING';
//     const updatedInfo = {
//         title: updatedTitle,
//         startTime: updatedStartTime,
//         description: updatedDescription,
//         status: updatedStatus,
//     };
//     const meeting = await ctx.prisma.meeting.create({
//         data: {
//             title,
//             startTime,
//             description,
//             status,
//             ownerId,
//             participants: {
//                 create: {
//                     userId: ctx.userId,
//                     role: 'ADMIN',
//                     isVotingEligible: true,
//                 },
//             },
//         },
//     });
//     const updatedMeeting = await ctx.client.request(
//         gql`
//             mutation UpdateMeeting($meeting: UpdateMeetingInput!) {
//                 updateMeeting(meeting: $meeting) {
//                     id
//                     title
//                     description
//                     startTime
//                     status
//                 }
//             }
//         `,
//         {
//             meeting: {
//                 id: meeting.id,
//                 ...updatedInfo,
//             },
//         }
//     );
//     expect(updatedMeeting.updateMeeting).toEqual({
//         id: meeting.id,
//         ...updatedInfo,
//     });
// });

// // Double check expect reject
// it('should throw error for not authorized when trying to update meeting', async () => {
//     const title = 'test get meeting by id ';
//     const startTime = '2021-04-13T14:06:30.000Z';
//     const description = 'test get meeting by id description';
//     const status = 'UPCOMING';
//     const ownerId = ctx.userId;
//     const updatedTitle = 'new title';
//     const updatedStartTime = '2021-05-13T14:06:30.000Z';
//     const updatedDescription = 'New description';
//     const updatedStatus = 'ONGOING';
//     const updatedInfo = {
//         title: updatedTitle,
//         startTime: updatedStartTime,
//         description: updatedDescription,
//         status: updatedStatus,
//     };
//     const meeting = await ctx.prisma.meeting.create({
//         data: {
//             title,
//             startTime,
//             description,
//             status,
//             ownerId,
//             participants: {
//                 create: {
//                     userId: ctx.userId,
//                     role: 'COUNTER',
//                     isVotingEligible: true,
//                 },
//             },
//         },
//     });
//     expect(async () => {
//         await ctx.client.request(
//             gql`
//                 mutation UpdateMeeting($meeting: UpdateMeetingInput!) {
//                     updateMeeting(meeting: $meeting) {
//                         id
//                         title
//                         description
//                         startTime
//                         status
//                     }
//                 }
//             `,
//             {
//                 meeting: {
//                     id: meeting.id,
//                     ...updatedInfo,
//                 },
//             }
//         );
//     }).rejects.toThrow();
// });

it('should delete participant successfully', async () => {
    const title = 'test get meeting by id ';
    const startTime = '2021-04-13T14:06:30.000Z';
    const description = 'test get meeting by id description';
    const status = 'UPCOMING';
    const ownerId = ctx.userId;
    const otherUser = await ctx.prisma.user.create({
        data: {
            email: 'e@mail.com',
            password: 'secret',
        },
    });
    const meeting = await ctx.prisma.meeting.create({
        data: {
            title,
            startTime,
            description,
            status,
            ownerId,
            participants: {
                create: {
                    userId: ctx.userId,
                    role: 'ADMIN',
                    isVotingEligible: true,
                },
            },
        },
    });
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
    const title = 'test get meeting by id ';
    const startTime = '2021-04-13T14:06:30.000Z';
    const description = 'test get meeting by id description';
    const status = 'UPCOMING';
    const ownerId = ctx.userId;
    const meeting = await ctx.prisma.meeting.create({
        data: {
            title,
            startTime,
            description,
            status,
            ownerId,
            participants: {
                create: {
                    userId: ctx.userId,
                    role: 'ADMIN',
                    isVotingEligible: true,
                },
            },
        },
    });
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
    const title = 'test get meeting by id ';
    const startTime = '2021-04-13T14:06:30.000Z';
    const description = 'test get meeting by id description';
    const status = 'UPCOMING';
    const otherUser = await ctx.prisma.user.create({
        data: {
            email: 'e@mail.com',
            password: 'secret',
        },
    });
    const ownerId = otherUser.id;
    const meeting = await ctx.prisma.meeting.create({
        data: {
            title,
            startTime,
            description,
            status,
            ownerId,
            participants: {
                create: {
                    userId: ownerId,
                    role: 'ADMIN',
                    isVotingEligible: true,
                },
            },
        },
    });
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
