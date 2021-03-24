import { makeSchema } from 'nexus';
import { join } from 'path';
import * as UserSchema from './auth/user';
import * as VotationSchema from './votation/votation';
import * as MeetingSchema from './meeting/meetings';
import { nexusPrisma } from 'nexus-plugin-prisma';

export const schema = makeSchema({
    types: [UserSchema, VotationSchema, MeetingSchema], // 1
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
});
