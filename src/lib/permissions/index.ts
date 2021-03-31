import { shield, and } from 'graphql-shield';
import { isAuthenticated, isParticipantOfMeeting, isParticipantOfVotation } from './rules';

const permissions = shield(
    {
        Query: {
            '*': isAuthenticated,
            meetingsById: and(isParticipantOfMeeting),
            votationsByMeeting: and(isParticipantOfMeeting),
            alternativesByVotation: and(isParticipantOfVotation),
        },
        Mutation: {
            '*': isAuthenticated,
            castVote: and(isParticipantOfVotation),
        },
    },
    { allowExternalErrors: true }
);

export default permissions;
