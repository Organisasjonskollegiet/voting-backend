import { shield, and, or } from 'graphql-shield';
import {
    isAuthenticated,
    isParticipantOfMeeting,
    isParticipantOfVotation,
    isAdminOfMeetingId,
    isAdminOfMeetingByObject,
    isAdminOfVotationByObject,
    isAdminOfVotationById,
    isAdminOfVotationByMeetingId,
    isAdminOfAlternative,
    isCounterOfMeeting,
    isOwnerOfMeeting,
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
            // createVotation: and(isAdminOfVotationByMeetingId),
            createVotations: and(isAdminOfMeetingId),
            updateMeeting: and(isAdminOfMeetingByObject),
            updateVotation: and(isAdminOfVotationByObject),
            updateAlternative: and(isAdminOfAlternative),
            deleteParticipant: and(isAdminOfMeetingId),
            deleteAlternative: and(isAdminOfAlternative),
            deleteVotation: and(isAdminOfVotationById),
            deleteMeeting: and(isOwnerOfMeeting),
        },
        Alternative: {
            votes: or(isAdminOfMeetingId, isCounterOfMeeting),
        },
    },
    // If rule is not defined, use isAuthenticated rule
    { allowExternalErrors: true, fallbackRule: isAuthenticated }
);

export default permissions;
