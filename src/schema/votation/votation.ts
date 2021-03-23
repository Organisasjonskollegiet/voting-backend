import { enumType, extendType, list, objectType } from 'nexus';
import { Context } from '../../context';
import { User } from '../auth/user';
import { Meeting } from '../meeting/meetings';

export const MajorityType = enumType({
    name: 'MajorityType',
    members: ['QUALIFIED', 'SIMPLE'],
});
export const Status = enumType({
    name: 'Status',
    members: ['UPCOMING', 'ONGOING', 'ENDED'],
});

export const Alternative = objectType({
    name: 'Alternative',
    definition: (t) => {
        t.nonNull.id('id');
        t.nonNull.string('text');
        t.field('votation', { type: Votation });
    },
});

export const Votation = objectType({
    name: 'Votation',
    definition: (t) => {
        t.nonNull.id('id');
        t.nonNull.string('title');
        t.nonNull.string('description');
        t.int('order');
        t.nonNull.field('status', { type: Status });
        t.boolean('blankVotes');
        t.nonNull.field('majorityType', { type: MajorityType });
        t.nonNull.int('majorityThreshold');
        t.nonNull.field('meeting', { type: Meeting });
        t.list.field('hasVoted', { type: User });
        t.list.field('alternatives', { type: Alternative });
    },
});

export const AlternativeQuery = extendType({
    type: 'Query',
    definition: (t) => {
        t.field('hello', {
            type: list(Alternative),
            resolve: (_, __, ctx: Context) => {
                return ctx.prisma.alternative.findMany();
            },
        });
    },
});
