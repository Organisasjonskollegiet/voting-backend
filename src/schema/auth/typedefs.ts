import { inputObjectType, objectType } from 'nexus';

export const User = objectType({
    name: 'User',
    definition(t) {
        t.nonNull.id('id');
        t.nonNull.string('username');
        t.nonNull.string('email');
    },
});

export const AddUserInputType = inputObjectType({
    name: 'AddUserInput',
    definition(t) {
        t.id('id');
        t.nonNull.string('username');
        t.nonNull.string('email');
        t.nonNull.string('password');
    },
});
