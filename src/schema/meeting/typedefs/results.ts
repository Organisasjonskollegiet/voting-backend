import { objectType, unionType } from 'nexus';

export const OwnerCannotBeRemovedFromParticipantError = objectType({
    name: 'OwnerCannotBeRemovedFromParticipantError',
    definition(t) {
        t.nonNull.string('message');
    },
});

// Can be deleted if not used
export const DeleteParticipantResult = unionType({
    name: 'DeleteParticipantResult',
    definition(t) {
        t.members('Participant', 'OwnerCannotBeRemovedFromParticipantError');
    },
});
