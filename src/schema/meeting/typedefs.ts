import { objectType, list } from 'nexus';
import { Meeting as MeetingType } from '@prisma/client';
import { Role, Status } from '../enums';
import { Votation } from '../votation/votation';

export const Meeting = objectType({
    name: 'Meeting',
    definition: (t) => {
        t.nonNull.id('id');
        t.nonNull.string('title');
        t.model.startTime();
        t.string('description');
        t.nonNull.model.owner();
        t.field('votations', {
            type: list(Votation),
            resolve: async (source, __, ctx) => {
                const { id } = source as MeetingType;
                const votation = await ctx.prisma.votation.findMany({ where: { meetingId: id } });
                return votation;
            },
        });
        t.nonNull.field('status', { type: Status });
        t.nonNull.field('participants', {
            type: list(Participant),
            resolve: async (source, __, ctx) => {
                const { id } = source as MeetingType;
                const participants = await ctx.prisma.participant.findMany({
                    where: {
                        meetingId: id,
                    },
                });
                return participants;
            },
        });
    },
});

export const Participant = objectType({
    name: 'Participant',
    definition(t) {
        t.nonNull.field('role', { type: Role });
        t.nonNull.boolean('isVotingEligible');
        t.model.user();
    },
});
