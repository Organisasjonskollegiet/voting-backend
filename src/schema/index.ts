import { makeSchema } from 'nexus';
import { join } from 'path';
import * as UserSchema from './auth/';
import * as VotationSchema from './votation/';
import * as MeetingSchema from './meeting';
import * as Enums from './enums';
import { GQLDateTime } from './scalars';
import { nexusPrisma } from 'nexus-plugin-prisma';
import { applyMiddleware } from 'graphql-middleware';
import permissions from '../lib/permissions';

const baseSchema = makeSchema({
    types: [GQLDateTime, Enums, UserSchema, VotationSchema, MeetingSchema], // 1
    outputs: {
        typegen: join(__dirname, '../__generated__', 'nexus-typegen.ts'), // 2
        schema: join(__dirname, '../__generated__', 'schema.graphql'), // 3
    },
    plugins: [
        nexusPrisma({
            outputs: { typegen: join(__dirname + '../../__generated__', 'typegen-nexus-plugin-prisma.d.ts') },
        }),
    ],
    contextType: {
        module: require.resolve('../context'),
        export: 'Context',
    },
    features: {
        abstractTypeStrategies: {
            __typename: true,
        },
    },
});

export const protectedSchema = applyMiddleware(baseSchema, permissions);
