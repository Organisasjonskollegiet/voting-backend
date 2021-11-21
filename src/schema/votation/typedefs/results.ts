import { objectType, unionType } from 'nexus';

export const MaxOneOpenVotationError = objectType({
    name: 'MaxOneOpenVotationError',
    definition(t) {
        t.nonNull.string('message');
    },
});

export const NoUpcomingVotations = objectType({
    name: 'NoUpcomingVotations',
    definition(t) {
        t.nonNull.string('message');
    },
});

export const VotationHasNoAlternatives = objectType({
    name: 'VotationHasNoAlternatives',
    definition(t) {
        t.nonNull.string('message');
    },
});

export const OpenedVotation = objectType({
    name: 'OpenedVotation',
    definition(t) {
        t.nonNull.string('votationId');
        t.nonNull.string('title');
    },
});

export const OpenVotationResult = unionType({
    name: 'OpenVotationResult',
    definition(t) {
        t.members('OpenedVotation', 'MaxOneOpenVotationError', 'NoUpcomingVotations', 'VotationHasNoAlternatives');
    },
});

export const NoReview = objectType({
    name: 'NoReview',
    definition(t) {
        t.nonNull.string('message');
    },
});

export const MyReviewResult = unionType({
    name: 'MyReviewResult',
    definition(t) {
        t.members('VotationReview', 'NoReview');
    },
});

export const ReviewResult = objectType({
    name: 'ReviewResult',
    definition: (t) => {
        t.nonNull.int('approved');
        t.nonNull.int('disapproved');
    },
});
