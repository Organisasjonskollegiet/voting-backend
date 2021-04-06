import { shield, and } from 'graphql-shield';
import { isAuthenticated, isParticipantOfMeeting, isParticipantOfVotation, isAdmin } from './rules';

const permissions = shield(
    {
        Query: {
            meetingsById: and(isParticipantOfMeeting),
            votationsByMeeting: and(isParticipantOfMeeting),
            alternativesByVotation: and(isParticipantOfVotation),
        },
        Mutation: {
            castVote: and(isParticipantOfVotation),
            createVotation: and(isAdmin),
        },
    },
    // If rule is not defined, use isAuthenticated rule
    { allowExternalErrors: true, fallbackRule: isAuthenticated }
);

export default permissions;
