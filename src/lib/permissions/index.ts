import { shield, and } from 'graphql-shield';
import { isAuthenticated, isParticipantOfMeeting, isParticipantOfVotation, isAdmin } from './rules';

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
            createVotation: and(isAdmin),
        },
    },
    { allowExternalErrors: true }
);

export default permissions;
