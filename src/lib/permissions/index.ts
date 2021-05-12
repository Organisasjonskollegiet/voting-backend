import { shield, and, or } from 'graphql-shield';
import {
    isAuthenticated,
    isParticipantOfMeeting,
    isParticipantOfVotation,
    isAdminOfMeetingById,
    isAdminOfMeetingByObject,
    isAdminOfVotation,
    isAdminOfVotationByMeetingId,
    isAdminOfAlternative,
    isCounterOfMeeting,
} from './rules';

const permissions = shield(
    {
        Query: {
            meetingsById: and(isParticipantOfMeeting),
            alternativesByVotation: and(isParticipantOfVotation),
            votationById: and(isParticipantOfVotation),
        },
        Mutation: {
            castVote: and(isParticipantOfVotation),
            createVotation: and(isAdminOfVotationByMeetingId),
            updateMeeting: and(isAdminOfMeetingByObject),
            updateVotation: and(isAdminOfVotation),
            updateAlternative: and(isAdminOfAlternative),
            deleteAlternative: and(isAdminOfAlternative),
        },
        Alternative: {
            votes: or(isAdminOfMeetingById, isCounterOfMeeting),
        },
    },
    // If rule is not defined, use isAuthenticated rule
    { allowExternalErrors: true, fallbackRule: isAuthenticated }
);

export default permissions;
