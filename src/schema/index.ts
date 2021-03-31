import { makeSchema } from 'nexus';
import { join } from 'path';
import * as UserSchema from './auth/';
import * as VotationSchema from './votation/';
import * as MeetingSchema from './meeting';
import * as Enums from './enums';
import { nexusPrisma } from 'nexus-plugin-prisma';

export const schema = makeSchema({
    types: [Enums, UserSchema, VotationSchema, MeetingSchema], // 1
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
