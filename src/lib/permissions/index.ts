import { shield, and } from 'graphql-shield';
import { isAuthenticated, isParticipantOfMeeting, isParticipantOfVotation, isVotingEligible } from './rules';

const permissions = shield({
    Query: {
        users: isAuthenticated,
        user: isAuthenticated,
        meetings_for_user: isAuthenticated,
        meetings_for_user_by_id: and(isAuthenticated, isParticipantOfMeeting),
        votations_by_meeting: and(isAuthenticated, isParticipantOfMeeting),
        alternatives_by_votation: and(isAuthenticated, isParticipantOfVotation),
    },
    Mutation: {
        addUser: isAuthenticated,
        cast_vote: and(isAuthenticated, isParticipantOfVotation, isVotingEligible),
    },
});

export default permissions;
