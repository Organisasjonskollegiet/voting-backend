import { makeExecutableSchema } from '@graphql-tools/schema';
import { gql, IResolvers } from 'apollo-server';
import { Context } from '../../context';
import { Resolvers } from '../../__generated__/graphql';
import withAuth from 'graphql-auth';

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
        users: withAuth(async (_: any, __: any, ctx: Context) => {
            return ctx.prisma.user.findMany();
        }),
    },
    Mutation: {
        addUser: withAuth(async (_: any, args: any, ctx: Context) => {
            const user = await ctx.prisma.user.create({ data: args });
            return user;
        }),
    },
};

export const authSchema = makeExecutableSchema({
    typeDefs,
    resolvers: resolvers as IResolvers,
});
