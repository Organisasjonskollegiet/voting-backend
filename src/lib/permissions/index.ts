import { shield, and, or, allow } from 'graphql-shield';
import {
    isParticipantOfMeeting,
    isParticipantOfVotation,
    isCounterOfVotationById,
    isAdminOfMeetingId,
    isAdminOfMeetingByObject,
    isAdminOfVotationsByObjects,
    isAdminOfVotationsById,
    isAdminOfAlternatives,
    isOwnerOfMeeting,
    isAdminOfVotationById,
    resultIsPublished,
    userCanVoteOnVotation,
    userCanVoteOnAlternative,
    votesNotHidden,
    votationsAreUpcoming,
} from './rules';

const permissions = shield(
    {
        Query: {
            meetingById: and(isParticipantOfMeeting),
            votationById: and(isParticipantOfVotation),
            getVotationResults: or(
                isAdminOfVotationById,
                isCounterOfVotationById,
                and(isParticipantOfVotation, resultIsPublished, votesNotHidden)
            ),
            getStvResult: or(
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
            updateVotations: and(isAdminOfVotationsByObjects, votationsAreUpcoming),
            updateVotationIndexes: and(isAdminOfVotationsByObjects, votationsAreUpcoming),
            updateVotationStatus: and(isAdminOfVotationById),
            updateParticipant: and(isAdminOfMeetingId),
            deleteParticipants: and(isAdminOfMeetingId),
            deleteAlternatives: and(isAdminOfAlternatives),
            deleteVotations: and(isAdminOfVotationsById),
            deleteMeeting: and(isOwnerOfMeeting),
            reviewVotation: or(isAdminOfVotationById, isCounterOfVotationById),
        },
        Subscription: {
            newVoteRegistered: allow,
            votationStatusUpdated: allow,
            votationOpenedForMeeting: allow,
        },
    },
    // If rule is not defined, use isAuthenticated rule
    { allowExternalErrors: true }
);

export default permissions;
