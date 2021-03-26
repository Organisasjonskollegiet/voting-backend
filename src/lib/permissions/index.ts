import { shield, and } from 'graphql-shield';
import { isAuthenticated, isParticipant, isVotingEligible } from './rules';

const permissions = shield({
    Query: {
        users: isAuthenticated,
        user: isAuthenticated,
        meetings_for_user: isAuthenticated,
        votations_by_meeting: and(isAuthenticated, isParticipant),
    },
    Mutation: {
        users: isAuthenticated,
        cast_vote: and(isAuthenticated, isParticipant, isVotingEligible),
    },
});

export default permissions;
