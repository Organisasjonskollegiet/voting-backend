import { objectType, unionType } from 'nexus';

export const UserNotFoundError = objectType({
    name: 'UserNotFoundError',
    definition(t) {
        t.nonNull.string('message');
    },
});

export const GetUserResult = unionType({
    name: 'GetUserResult',
    definition(t) {
        t.members('User', 'UserNotFoundError');
    },
});
