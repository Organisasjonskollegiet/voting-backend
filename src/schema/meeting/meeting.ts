import { gql } from 'apollo-server';
import { Context } from '../../context';
import { Resolvers } from '../../__generated__/resolvers';

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
            return ctx.prisma.meeting.findMany();
        },
    },
    Mutation: {},
    Meeting: {
        owner: async (parent, _, ctx: Context) => {
            const user = await ctx.prisma.user.findUnique({ where: { id: parent.ownerId } });
            if (!user) throw new Error('The owner of this meeting was not found');
            return user;
        },
    },
};
