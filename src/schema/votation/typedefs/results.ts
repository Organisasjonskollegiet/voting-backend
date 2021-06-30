import { objectType, unionType } from 'nexus';

export const MaxOneOpenVotationError = objectType({
    name: 'MaxOneOpenVotationError',
    definition(t) {
        t.nonNull.string('message');
    },
});

export const UpdateVotationStatusResult = unionType({
    name: 'UpdateVotationStatusResult',
    definition(t) {
        t.members('Votation', 'MaxOneOpenVotationError');
    },
});
