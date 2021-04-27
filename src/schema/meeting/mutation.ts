import { inputObjectType, mutationField, nonNull } from 'nexus';
import { Meeting } from './typedefs';

export const CreateMeetingInput = inputObjectType({
    name: 'CreateMeetingInput',
    definition(t) {
        t.nonNull.string('title');
        t.nonNull.datetime('startTime');
        t.nonNull.string('description', { default: 'Ingen beskrivelse satt.' });
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
