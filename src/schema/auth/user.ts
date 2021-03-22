import { makeExecutableSchema } from '@graphql-tools/schema';
import { gql, IResolvers } from 'apollo-server';
import { Context } from '../../context';
import { Resolvers } from '../../__generated__/graphql';

export const typeDefs = gql`
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

const resolvers: Resolvers = {
    Query: {
        users: async (_, __, ctx: Context) => {
            return ctx.prisma.user.findMany();
        },
    },
    Mutation: {
        addUser: async (_, args, ctx: Context, __) => {
            const user = await ctx.prisma.user.create({ data: args });
            return user;
        },
    },
};

export const authSchema = makeExecutableSchema({
    typeDefs,
    resolvers: resolvers as IResolvers,
});
