import { inputObjectType, mutationField, nonNull, stringArg, list } from 'nexus';
import { parentPort } from 'node:worker_threads';
import { MeetingStatus, Role } from '../enums';
import { Meeting } from './typedefs';

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
        t.field('status', { type: MeetingStatus });
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

export const UpdateParticipantInput = inputObjectType({
    name: 'UpdateParticipantInput',
    definition(t) {
        t.nonNull.string('email');
        t.nonNull.field('role', { type: Role });
        t.nonNull.boolean('isVotingEligible');
        t.nonNull.boolean('userExists');
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

export const DeleteMeetingMutation = mutationField('deleteMeeting', {
    type: Meeting,
    description: '',
    args: {
        id: nonNull(stringArg()),
    },
    resolve: async (_, { id }, ctx) => {
        await ctx.prisma.vote.deleteMany({ where: { alternative: { votation: { meetingId: id } } } });
        await ctx.prisma.hasVoted.deleteMany({ where: { votation: { meetingId: id } } });
        await ctx.prisma.alternative.deleteMany({ where: { votation: { meetingId: id } } });
        await ctx.prisma.votation.deleteMany({ where: { meetingId: id } });
        await ctx.prisma.participant.deleteMany({ where: { meetingId: id } });
        const deletedMeeting = await ctx.prisma.meeting.delete({ where: { id } });
        return deletedMeeting;
    },
});

export const AddParticipantsMutation = mutationField('addParticipants', {
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
                            isVotingEligible: participant.isVotingEligible,
                            meetingId,
                        },
                        update: {
                            role: participant.role,
                            isVotingEligible: participant.isVotingEligible,
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

export const UpdateParticipantsMutation = mutationField('updateParticipants', {
    type: 'Int',
    description: '',
    args: {
        meetingId: nonNull(stringArg()),
        participants: nonNull(list(nonNull('UpdateParticipantInput'))),
    },
    resolve: async (_, { meetingId, participants }, ctx) => {
        const meeting = await ctx.prisma.meeting.findUnique({
            where: {
                id: meetingId,
            },
        });
        const promises: Promise<string>[] = [];
        participants.forEach((participant) =>
            promises.push(
                new Promise(async (resolve) => {
                    if (participant.userExists) {
                        const user = await ctx.prisma.user.findUnique({
                            where: {
                                email: participant.email,
                            },
                        });
                        if (!user) throw new Error('User does not exist');
                        if (user.id === meeting?.ownerId) throw new Error('Cannot change role of meeting owner');
                        await ctx.prisma.participant.update({
                            where: {
                                userId_meetingId: { userId: user.id, meetingId },
                            },
                            data: {
                                role: participant.role,
                                isVotingEligible: participant.isVotingEligible,
                            },
                        });
                        resolve(participant.email);
                    } else {
                        await ctx.prisma.invite.update({
                            where: {
                                email_meetingId: { email: participant.email, meetingId },
                            },
                            data: {
                                role: participant.role,
                                isVotingEligible: participant.isVotingEligible,
                            },
                        });
                        resolve(participant.email);
                    }
                })
            )
        );
        const resolved = await Promise.all(promises);
        return resolved.length;
    },
});

export const DeleteParticipantsMutation = mutationField('deleteParticipants', {
    type: list('String'),
    description: '',
    args: {
        meetingId: nonNull(stringArg()),
        emails: nonNull(list(nonNull(stringArg()))),
    },
    resolve: async (_, { meetingId, emails }, ctx) => {
        const meeting = await ctx.prisma.meeting.findUnique({
            where: {
                id: meetingId,
            },
        });
        const promises: Promise<string>[] = [];
        emails.forEach((email: string) => {
            promises.push(
                new Promise(async (resolve) => {
                    const user = await ctx.prisma.user.findUnique({
                        where: {
                            email,
                        },
                    });
                    if (user) {
                        if (meeting?.ownerId !== user?.id) {
                            await ctx.prisma.participant.delete({
                                where: {
                                    userId_meetingId: { userId: user.id, meetingId },
                                },
                            });
                            resolve(email);
                        }
                    } else {
                        await ctx.prisma.invite.delete({
                            where: {
                                email_meetingId: { meetingId, email },
                            },
                        });
                        resolve(email);
                    }
                    resolve('');
                })
            );
        });
        const resolved = await Promise.all(promises);
        return resolved;
    },
});
