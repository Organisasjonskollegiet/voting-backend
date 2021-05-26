import { objectType, unionType } from 'nexus';

export const OwnerCannotBeRemovedFromParticipantError = objectType({
    name: 'OwnerCannotBeRemovedFromParticipantError',
    definition(t) {
        t.nonNull.string('message');
    },
});

export const DeleteParticipantResult = unionType({
    name: 'DeleteParticipantResult',
    definition(t) {
        t.members('Participant', 'OwnerCannotBeRemovedFromParticipantError');
    },
});
