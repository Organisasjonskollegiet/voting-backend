import { objectType, unionType } from 'nexus';

export const UserNotFoundError = objectType({
    name: 'UserNotFoundError',
    definition(t) {
        t.nonNull.string('message');
    },
});

export const InvalidPasswordError = objectType({
    name: 'InvalidPasswordError',
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

export const LoginResult = unionType({
    name: 'LoginResult',
    definition(t) {
        t.members('User', 'UserNotFoundError', 'InvalidPasswordError');
    },
});
