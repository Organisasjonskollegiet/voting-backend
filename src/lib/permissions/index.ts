import { shield, and, or, allow } from 'graphql-shield';
import {
    isAuthenticated,
    isParticipantOfMeeting,
    isParticipantOfVotation,
    // isParticipantOfAlternativeId,
    isCounterOfMeeting,
    isAdminOfMeetingId,
    isAdminOfMeetingByObject,
    isAdminOfVotationsByObjects,
    isAdminOfVotationsById,
    isAdminOfAlternative,
    isAdminOfAlternatives,
    isOwnerOfMeeting,
    userCanVote,
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
            castVote: and(userCanVote),
            createVotations: and(isAdminOfMeetingId),
            updateMeeting: and(isAdminOfMeetingByObject),
            updateVotations: and(isAdminOfVotationsByObjects),
            updateAlternative: and(isAdminOfAlternative),
            deleteParticipant: and(isAdminOfMeetingId),
            deleteAlternatives: and(isAdminOfAlternatives),
            deleteVotations: and(isAdminOfVotationsById),
            deleteMeeting: and(isOwnerOfMeeting),
        },
        Subscription: {
            viewChanged: allow,
            newVoteRegistered: allow /*and(isParticipantOfAlternativeId)*/,
        },
        Alternative: {
            votes: or(isAdminOfMeetingId, isCounterOfMeeting),
        },
    },
    // If rule is not defined, use isAuthenticated rule
    { allowExternalErrors: true, fallbackRule: isAuthenticated }
);

export default permissions;
