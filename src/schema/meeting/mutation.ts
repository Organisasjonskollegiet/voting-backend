import { User, Invite } from '.prisma/client';
import { email } from 'casual';
import { inputObjectType, mutationField, nonNull, stringArg, list } from 'nexus';
import { Status, Role } from '../enums';
import { Meeting, DeleteParticipantResult, Participant } from './typedefs';

export const CreateMeetingInput = inputObjectType({
    name: 'CreateMeetingInput',
    definition(t) {
        t.nonNull.string('organization');
        t.nonNull.string('title');
        t.nonNull.datetime('startTime');
        t.nonNull.string('description', { default: 'Ingen beskrivelse satt.' });
    },
});

export const UpdateMeetingInput = inputObjectType({
    name: 'UpdateMeetingInput',
    definition(t) {
        t.nonNull.string('id');
        t.string('organization');
        t.string('title');
        t.datetime('startTime');
        t.string('description');
        t.field('status', { type: Status });
    },
});

export const ParticipantInput = inputObjectType({
    name: 'ParticipantInput',
    definition(t) {
        t.nonNull.string('email');
        t.nonNull.field('role', { type: Role });
        t.nonNull.boolean('isVotingEligible');
    },
});

export const CreateMeetingMutation = mutationField('createMeeting', {
    type: Meeting,
    description: '',
    args: {
        meeting: nonNull(CreateMeetingInput),
    },
    resolve: async (_, { meeting }, ctx) => {
        const createdMeeting = await ctx.prisma.meeting.create({
            data: {
                ...meeting,
                ownerId: ctx.userId,
                status: 'UPCOMING',
                participants: {
                    create: {
                        userId: ctx.userId,
                        role: 'ADMIN',
                        isVotingEligible: true,
                    },
                },
            },
        });
        return createdMeeting;
    },
});

export const UpdateMeetingMutation = mutationField('updateMeeting', {
    type: Meeting,
    description: '',
    args: {
        meeting: nonNull(UpdateMeetingInput),
    },
    resolve: async (_, { meeting }, ctx) => {
        const updatedMeeting = await ctx.prisma.meeting.update({
            data: {
                title: meeting.title ?? undefined,
                organization: meeting.organization ?? undefined,
                startTime: meeting.startTime ?? undefined,
                description: meeting.description ?? undefined,
                status: meeting.status ?? undefined,
            },
            where: {
                id: meeting.id,
            },
        });
        return updatedMeeting;
    },
});

export const AddParticipants = mutationField('addParticipants', {
    type: 'Int',
    description: '',
    args: {
        meetingId: nonNull(stringArg()),
        participants: nonNull(list(nonNull(ParticipantInput))),
    },
    resolve: async (_, { meetingId, participants }, ctx) => {
        let participantsAdded = 0;
        for (const participant of participants) {
            try {
                const user = await ctx.prisma.user.findUnique({ where: { email: participant.email } });
                if (user) {
                    await ctx.prisma.participant.upsert({
                        where: {
                            userId_meetingId: {
                                userId: user?.id,
                                meetingId,
                            },
                        },
                        update: {
                            role: participant.role,
                            isVotingEligible: participant.isVotingEligible,
                        },
                        create: {
                            role: participant.role,
                            userId: user?.id ?? null,
                            meetingId,
                            isVotingEligible: participant.isVotingEligible,
                        },
                    });
                    participantsAdded += 1;
                } else {
                    await ctx.prisma.invite.upsert({
                        where: {
                            email_meetingId: {
                                email: participant.email,
                                meetingId,
                            },
                        },
                        create: {
                            email: participant.email,
                            role: participant.role,
                            meetingId,
                        },
                        update: {
                            role: participant.role,
                        },
                    });
                    participantsAdded += 1;
                }
            } catch (error) {
                console.log(error);
            }
        }
        return participantsAdded;
    },
});

export const DeleteParticipantMutation = mutationField('deleteParticipant', {
    type: DeleteParticipantResult,
    description: '',
    args: {
        meetingId: nonNull(stringArg()),
        userId: nonNull(stringArg()),
    },
    resolve: async (_, { meetingId, userId }, ctx) => {
        const meeting = await ctx.prisma.meeting.findUnique({
            where: {
                id: meetingId,
            },
        });
        if (meeting?.ownerId === userId)
            return {
                __typename: 'OwnerCannotBeRemovedFromParticipantError',
                message: 'The owner of the meeting cannot be removed from being a participant.',
            };
        const deletedParticipant = await ctx.prisma.participant.delete({
            where: {
                userId_meetingId: { userId, meetingId },
            },
        });
        return { __typename: 'Participant', ...deletedParticipant };
    },
});

export const DeleteMeetingMutation = mutationField('deleteMeeting', {
    type: Meeting,
    description: '',
    args: {
        id: nonNull(stringArg()),
    },
    resolve: async (_, { id }, ctx) => {
        await ctx.prisma.alternative.deleteMany({ where: { votation: { meetingId: id } } });
        await ctx.prisma.votation.deleteMany({ where: { meetingId: id } });
        await ctx.prisma.participant.deleteMany({ where: { meetingId: id } });
        const deletedMeeting = await ctx.prisma.meeting.delete({ where: { id } });
        return deletedMeeting;
    },
});
