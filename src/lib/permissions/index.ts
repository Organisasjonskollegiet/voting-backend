import { shield, and } from 'graphql-shield';
import { isAuthenticated, isParticipantOfMeeting, isParticipantOfVotation } from './rules';

const permissions = shield(
    {
        Query: {
            user: isAuthenticated,
            meetings: isAuthenticated,
            meetingsById: and(isAuthenticated, isParticipantOfMeeting),
            votationsByMeeting: and(isAuthenticated, isParticipantOfMeeting),
            alternativesByVotation: and(isAuthenticated, isParticipantOfVotation),
        },
        Mutation: {
            castVote: and(isAuthenticated, isParticipantOfVotation),
        },
    },
    { allowExternalErrors: true }
);

export default permissions;
