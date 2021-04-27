import { shield, and, or } from 'graphql-shield';
import {
    isAuthenticated,
    isParticipantOfMeeting,
    isParticipantOfVotation,
    isAdminOfMeeting,
    isCounterOfMeeting,
} from './rules';

const permissions = shield(
    {
        Query: {
            meetingsById: and(isParticipantOfMeeting),
            alternativesByVotation: and(isParticipantOfVotation),
        },
        Mutation: {
            castVote: and(isParticipantOfVotation),
            createVotation: and(isAdminOfMeeting),
        },
        Alternative: {
            votes: or(isAdminOfMeeting, isCounterOfMeeting),
        },
    },
    // If rule is not defined, use isAuthenticated rule
    { allowExternalErrors: true, fallbackRule: isAuthenticated }
);

export default permissions;
