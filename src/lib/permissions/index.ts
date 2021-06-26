import { shield, and, or } from 'graphql-shield';
import {
    isAuthenticated,
    isParticipantOfMeeting,
    isParticipantOfVotation,
    isAdminOfMeetingId,
    isAdminOfMeetingByObject,
    isAdminOfVotationsByObjects,
    isAdminOfVotationById,
    isAdminOfVotationByMeetingId,
    isAdminOfVotationsById,
    isAdminOfAlternative,
    isAdminOfAlternatives,
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
            addParticipants: and(isAdminOfMeetingId),
            castVote: and(isParticipantOfVotation),
            createVotations: and(isAdminOfMeetingId),
            updateMeeting: and(isAdminOfMeetingByObject),
            updateVotations: and(isAdminOfVotationsByObjects),
            updateAlternative: and(isAdminOfAlternative),
            deleteParticipant: and(isAdminOfMeetingId),
            deleteAlternatives: and(isAdminOfAlternatives),
            // deleteVotation: and(isAdminOfVotationById),
            deleteVotations: and(isAdminOfVotationsById),
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
