import { gql } from 'apollo-server';
import { Resolvers } from '../../__generated__/graphql';
export const meetingTypeDefs = gql`
    type Meeting {
        id: ID!
        title: String!
        startTime: String!
        description: String
        owner: User!
        votations: [Votation]
        status: Status!
    }

    type Query {
        allMeetings: [Meeting]
    }
`;
export const meetingResolvers: Resolvers = {
    Query: {
        allMeetings: () => {
            return [];
        },
    },
    Mutation: {},
};
