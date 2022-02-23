import { Participant, Role as RoleEnum } from '@prisma/client';
import { inputObjectType, mutationField, nonNull, stringArg, list } from 'nexus';
import { MeetingStatus, Role } from '../enums';
import { Meeting, ParticipantOrInvite } from './typedefs';
import sendEmail from '../../utils/sendEmail';
import { string } from 'casual';
import { pubsub } from '../../lib/pubsub';

export type ParticipantOrInviteType = {
    email: string;
    role: RoleEnum;
    isVotingEligible: boolean;
};

type RegisteredParticipant = ParticipantOrInviteType & {
    userId: string;
};

export const CreateMeetingInput = inputObjectType({
    name: 'CreateMeetingInput',
    definition(t) {
        t.nonNull.string('organization');
        t.nonNull.string('title');
        t.nonNull.datetime('startTime');
        t.string('description');
        t.nonNull.boolean('allowSelfRegistration');
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
        t.boolean('allowSelfRegistration');
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
                allowSelfRegistration: meeting.allowSelfRegistration ?? undefined,
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
        await ctx.prisma.alternativeRoundVoteCount.deleteMany({
            where: { alternative: { votation: { meetingId: id } } },
        });
        const deletedMeeting = await ctx.prisma.meeting.delete({ where: { id } });
        return deletedMeeting;
    },
});

export const UpdateParticipant = mutationField('updateParticipant', {
    type: ParticipantOrInvite,
    description: 'Update participants of a meeting.',
    args: {
        meetingId: nonNull(stringArg()),
        participant: nonNull(ParticipantInput),
    },
    resolve: async (_, { meetingId, participant }, ctx) => {
        // get user with the provided email
        const user = await ctx.prisma.user.findUnique({ where: { email: participant.email } });
        // if a user exist for that email create a participant for that user
        if (user) {
            const updatedParticipant = await ctx.prisma.participant.update({
                where: {
                    userId_meetingId: {
                        userId: user?.id,
                        meetingId,
                    },
                },
                data: {
                    role: participant.role,
                    isVotingEligible: participant.isVotingEligible,
                },
                select: {
                    user: true,
                    role: true,
                    isVotingEligible: true,
                },
            });
            await pubsub.publish(`PARTICIPANT_${user.id}_${meetingId}_UPDATED`, {
                role: participant.role,
                isVotingEligible: participant.isVotingEligible,
            });
            return {
                email: updatedParticipant.user.email,
                role: participant.role,
                isVotingEligible: participant.isVotingEligible,
            };
            // if no user exists, create an invite
        } else {
            const invite = await ctx.prisma.invite.update({
                where: {
                    email_meetingId: {
                        email: participant.email,
                        meetingId,
                    },
                },
                data: {
                    role: participant.role,
                    isVotingEligible: participant.isVotingEligible,
                },
            });
            return { email: invite.email, role: invite.role, isVotingEligible: invite.isVotingEligible };
        }
    },
});

export const AddParticipantsMutation = mutationField('addParticipants', {
    type: 'Int',
    description: 'Creates invites and participants for the emails provided.',
    args: {
        meetingId: nonNull(stringArg()),
        participants: nonNull(list(nonNull(ParticipantInput))),
    },
    resolve: async (_, { meetingId, participants }, ctx) => {
        const meeting = await ctx.prisma.meeting.findUnique({
            where: {
                id: meetingId,
            },
        });
        if (!meeting) throw new Error('Meeting does not exist.');
        const registeredParticipants: RegisteredParticipant[] = [];
        const unregisteredParticipants: typeof participants = [];
        const filterParticipantsPromises: Promise<string>[] = [];

        // Add promises sorting the participants into an array for those who are registered users and one for those who are not.
        participants.forEach((participant) =>
            filterParticipantsPromises.push(
                new Promise(async (resolve) => {
                    const user = await ctx.prisma.user.findUnique({ where: { email: participant.email } });
                    if (user) {
                        registeredParticipants.push({ ...participant, userId: user.id });
                    } else {
                        unregisteredParticipants.push(participant);
                    }
                    resolve('success');
                })
            )
        );

        // Wait for the participants to be sorted.
        await Promise.all(filterParticipantsPromises);

        // create all new Participants for the users that are already registered.
        const createdParticipants = await ctx.prisma.participant.createMany({
            data: registeredParticipants.map((participant) => {
                return {
                    userId: participant.userId,
                    role: participant.role,
                    isVotingEligible: participant.isVotingEligible,
                    meetingId,
                };
            }),
        });

        // create invtes for the participants that are not registered users.
        const creatednvites = await ctx.prisma.invite.createMany({
            data: unregisteredParticipants.map((participant) => {
                return {
                    ...participant,
                    meetingId,
                };
            }),
        });

        try {
            await sendEmail(unregisteredParticipants, false, meeting);

            await sendEmail(registeredParticipants, true, meeting);
        } catch (error) {
            console.log(error);
        }

        return creatednvites.count + createdParticipants.count;
    },
});

export const RegisterAsParticipant = mutationField('registerAsParticipant', {
    type: 'Participant',
    description: 'Register the logged in user as a participant.',
    args: {
        meetingId: nonNull(stringArg()),
    },
    resolve: async (_, { meetingId }, ctx) => {
        const existingParticipant = await ctx.prisma.participant.findUnique({
            where: {
                userId_meetingId: { meetingId, userId: ctx.userId },
            },
        });
        if (existingParticipant) return existingParticipant;
        return await ctx.prisma.participant.create({
            data: {
                userId: ctx.userId,
                meetingId,
                role: RoleEnum.PARTICIPANT,
            },
        });
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
        return resolved.filter((e) => e !== '');
    },
});
