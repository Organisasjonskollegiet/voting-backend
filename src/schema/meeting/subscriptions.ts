import { Role } from '.prisma/client';
import { nonNull, objectType, stringArg, subscriptionField } from 'nexus';
import { pubsub } from '../../lib/pubsub';

export const ParticipantUpdatedResponse = objectType({
    name: 'ParticipantUpdatedResponse',
    definition: (t) => {
        t.nonNull.field('role', { type: 'Role' });
        t.nonNull.boolean('isVotingEligible');
    },
});

export const VotationOpenedForMeeting = subscriptionField('votationOpenedForMeeting', {
    type: 'String',
    args: {
        meetingId: nonNull(stringArg()),
    },
    subscribe: async (_, { meetingId }, ___) => {
        return pubsub.asyncIterator([`VOTATION_OPENED_FOR_MEETING_${meetingId}`]);
    },
    resolve: (votationId: string, __, ___) => {
        return votationId;
    },
});

export const ParticipantUpdated = subscriptionField('participantUpdated', {
    type: ParticipantUpdatedResponse,
    args: {
        meetingId: nonNull(stringArg()),
        userId: nonNull(stringArg()),
    },
    subscribe: async (_, { meetingId, userId }, __) => {
        return pubsub.asyncIterator([`PARTICIPANT_${userId}_${meetingId}_UPDATED`]);
    },
    resolve: (participant: { role: Role; isVotingEligible: boolean }) => {
        return participant;
    },
});
