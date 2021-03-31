import { inputObjectType, objectType, unionType } from 'nexus';

export const User = objectType({
    name: 'User',
    definition(t) {
        t.nonNull.id('id');
        t.nonNull.string('email');
    },
});

export const AddUserInputType = inputObjectType({
    name: 'AddUserInput',
    definition(t) {
        t.id('id');
        t.nonNull.string('email');
        t.nonNull.string('password');
    },
});

export const UserNotFoundError = objectType({
    name: 'UserNotFoundError',
    definition(t) {
        t.nonNull.string('message');
    },
});

export const UserQueryResult = unionType({
    name: 'UserQueryResult',
    definition(t) {
        t.members('User', 'UserNotFoundError');
    },
});
