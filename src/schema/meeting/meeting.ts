import { gql } from 'apollo-server';
import { Context } from '../../context';
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
        meetings: [Meeting]!
    }
`;
export const meetingResolvers: Resolvers = {
    Query: {
        meetings: async (_, __, ctx: Context) => {
            const meetings = await ctx.prisma.meeting.findMany({
                include: {
                    owner: true,
                },
            });
            return meetings;
        },
    },
    Mutation: {},
};
