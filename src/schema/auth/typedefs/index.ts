import { objectType } from 'nexus';

export const User = objectType({
    name: 'User',
    definition(t) {
        t.nonNull.id('id');
        t.nonNull.string('email');
        t.nonNull.boolean('emailVerified');
    },
});

export * from './results';
