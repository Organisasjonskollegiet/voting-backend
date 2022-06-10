import { shield, and, or, allow } from 'graphql-shield';
import {
    isParticipantOfMeeting,
    isParticipantOfVotation,
    isCounterOfVotationById,
    isAdminOfMeetingId,
    isAdminOfMeetingByObject,
    isAdminOfAlternatives,
    isOwnerOfMeeting,
    isAdminOfVotationById,
    resultIsPublished,
    userCanVoteOnVotation,
    userCanVoteOnAlternative,
    votesNotHidden,
    votationsAreUpcoming,
    votationsBelongToMeeting,
    isAuthenticated,
    meetingAllowsSelfRegistration,
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
            myParticipant: and(isParticipantOfMeeting),
            resultsOfPublishedVotations: and(isParticipantOfMeeting),
            getOpenVotation: and(isParticipantOfMeeting),
            getMyReview: and(isParticipantOfVotation),
            getReviews: and(isAdminOfVotationById),
            result: or(
                isAdminOfVotationById,
                isCounterOfVotationById,
                and(isParticipantOfVotation, resultIsPublished, votesNotHidden)
            ),
            numberOfUpcomingVotations: and(isParticipantOfMeeting),
            updateMyPassword: and(isAuthenticated),
        },
        Mutation: {
            addParticipants: and(isAdminOfMeetingId),
            castStvVote: and(userCanVoteOnVotation),
            castVote: and(userCanVoteOnAlternative),
            castBlankVote: and(userCanVoteOnVotation),
            createVotations: and(isAdminOfMeetingId),
            deleteMe: and(isAuthenticated),
            updateMeeting: and(isAdminOfMeetingByObject),
            updateVotations: and(votationsBelongToMeeting, isAdminOfMeetingId, votationsAreUpcoming),
            updateVotationIndexes: and(votationsBelongToMeeting, isAdminOfMeetingId, votationsAreUpcoming),
            updateVotationStatus: and(isAdminOfVotationById),
            updateParticipant: and(isAdminOfMeetingId),
            deleteParticipants: and(isAdminOfMeetingId),
            deleteAlternatives: and(isAdminOfAlternatives),
            deleteVotation: and(isAdminOfVotationById),
            deleteMeeting: and(isOwnerOfMeeting),
            reviewVotation: or(isAdminOfVotationById, isCounterOfVotationById),
            startNextVotation: and(isAdminOfMeetingId),
            registerAsParticipant: and(isAuthenticated, meetingAllowsSelfRegistration),
        },
        Subscription: {
            newVoteRegistered: allow,
            votationStatusUpdated: allow,
            votationOpenedForMeeting: allow,
            reviewAdded: allow,
        },
    },
    // If rule is not defined, use isAuthenticated rule
    { allowExternalErrors: true }
);

export default permissions;
