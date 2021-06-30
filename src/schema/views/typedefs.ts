import { objectType } from 'nexus';

export const ViewChangedPayload = objectType({
    name: 'ViewChangedPayload',
    description: 'The payload of viewChanged subscription',
    definition(t) {
        t.nonNull.field('viewState', { type: 'ViewState' }); // Enum som ligger i enums.ts
    },
});
