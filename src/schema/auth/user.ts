import { gql } from 'apollo-server';
import { Context } from '../../context';
import { Resolvers } from '../../__generated__/resolvers';
export const authTypeDefs = gql`
    type User {
        id: ID!
        username: String!
        email: String!
    }
    type Query {
        users: [User]!
    }
    type Mutation {
        addUser(username: String!, email: String!): User
    }
`;
export const authResolvers: Resolvers = {
    Query: {
        users: async (_, __, ctx: Context) => {
            return ctx.prisma.user.findMany();
        },
    },
    Mutation: {
        addUser: async (_, args, ctx: Context) => {
            const user = await ctx.prisma.user.create({ data: args });
            return user;
        },
    },
};
