import { nonNull, stringArg, subscriptionField } from 'nexus';
import { pubsub } from '../../lib/pubsub';

export const ViewChanged = subscriptionField('votationOpenedForMeeting', {
    type: 'String',
    args: {
        meetingId: nonNull(stringArg()),
    },
    subscribe: async (_, { meetingId }, ctx) => {
        return pubsub.asyncIterator([`VOTATION_OPENED_FOR_MEETING_${meetingId}`]);
    },
    resolve: (votationId: string, __, ctx) => {
        return votationId;
    },
});
