import { objectType } from 'nexus';
import { Role } from '../auth/user';

export const Participant = objectType({
    name: 'Participant',
    definition(t) {
        t.nonNull.field('role', { type: Role });
        t.nonNull.boolean('isVotingEligible');
        t.model.user();
    },
});
