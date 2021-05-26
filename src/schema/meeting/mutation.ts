import { inputObjectType, mutationField, nonNull, stringArg } from 'nexus';
import { Status } from '../enums';
import { Meeting, DeleteParticipantResult } from './typedefs';

export const CreateMeetingInput = inputObjectType({
    name: 'CreateMeetingInput',
    definition(t) {
        t.nonNull.string('title');
        t.nonNull.datetime('startTime');
        t.nonNull.string('description', { default: 'Ingen beskrivelse satt.' });
    },
});

export const UpdateMeetingInput = inputObjectType({
    name: 'UpdateMeetingInput',
    definition(t) {
        t.nonNull.string('id');
        t.string('title');
        t.datetime('startTime');
        t.string('description');
        t.field('status', { type: Status });
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
