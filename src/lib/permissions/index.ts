import { shield, and, or, allow } from 'graphql-shield';
import {
    isAuthenticated,
    isParticipantOfMeeting,
    isParticipantOfVotation,
    // isParticipantOfAlternativeId,
    isCounterOfVotationById,
    isAdminOfMeetingId,
    isAdminOfMeetingByObject,
    isAdminOfVotationsByObjects,
    isAdminOfVotationsById,
    isAdminOfAlternative,
    isAdminOfAlternatives,
    isOwnerOfMeeting,
    isAdminOfVotationById,
    resultIsPublished,
    userCanVoteOnVotation,
    userCanVoteOnAlternative,
    votesNotHidden,
} from './rules';

const permissions = shield(
    {
        Query: {
            meetingById: and(isParticipantOfMeeting),
            alternativesByVotation: and(isParticipantOfVotation),
            votationById: and(isParticipantOfVotation),
            getVotationResults: or(
                isAdminOfVotationById,
                isCounterOfVotationById,
                and(isParticipantOfVotation, resultIsPublished, votesNotHidden)
            ),
            getVoteCount: and(isParticipantOfVotation),
            getWinnerOfVotation: and(resultIsPublished),
            participants: and(isAdminOfMeetingId),
            resultsOfPublishedVotations: and(isParticipantOfMeeting),
            getOpenVotation: and(isParticipantOfMeeting),
        },
        Mutation: {
            addParticipants: and(isAdminOfMeetingId),
            castStvVote: and(userCanVoteOnVotation),
            castVote: and(userCanVoteOnAlternative),
            castBlankVote: and(userCanVoteOnVotation),
            createVotations: and(isAdminOfMeetingId),
            updateMeeting: and(isAdminOfMeetingByObject),
            updateVotations: and(isAdminOfVotationsByObjects),
            updateVotationStatus: and(isAdminOfVotationById),
            updateAlternative: and(isAdminOfAlternative),
            updateParticipant: and(isAdminOfMeetingId),
            deleteParticipants: and(isAdminOfMeetingId),
            deleteAlternatives: and(isAdminOfAlternatives),
            deleteVotations: and(isAdminOfVotationsById),
            deleteMeeting: and(isOwnerOfMeeting),
        },
        Subscription: {
            viewChanged: allow,
            newVoteRegistered: allow,
            votationStatusUpdated: allow,
            votationOpenedForMeeting: allow,
        },
    },
    // If rule is not defined, use isAuthenticated rule
    { allowExternalErrors: true, fallbackRule: isAuthenticated }
);

export default permissions;
