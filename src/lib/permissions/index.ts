import { shield, and } from 'graphql-shield';
import {
    isAuthenticated,
    isParticipantOfMeeting,
    isParticipantOfVotation,
    isAdminOfMeeting,
    isAdminOfVotation,
} from './rules';

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
            createVotation: and(isAdminOfMeeting),
            createAlternative: and(isAdminOfVotation),
        },
    },
    { allowExternalErrors: true }
);

export default permissions;
