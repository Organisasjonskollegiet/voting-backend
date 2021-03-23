import { gql } from 'apollo-server';
import { Resolvers } from '../../__generated__/graphql';
export const votationTypeDefs = gql`
    enum MajorityType {
        QUALIFIED
        SIMPLE
    }
    enum Status {
        UPCOMING
        ONGOING
        ENDED
    }
    type Votation {
        id: ID!
        title: String!
        description: String!
        order: Int
        status: Status!
        blankVotes: Boolean
        majorityType: MajorityType!
        majorityThreshold: Int!
        meeting: Meeting!
        hasVoted: [User]
        alternatives: [Alternative]
    }
    type Alternative {
        id: ID!
        text: String!
        votation: Votation!
    }
`;
export const votationResolvers: Resolvers = {
    Query: {},
    Mutation: {},
};
