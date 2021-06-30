import { subscriptionField } from 'nexus';
import { pubsub } from '../../lib/pubsub';
import { NexusGenObjects } from '../../__generated__/nexus-typegen';

type ViewChangedPayload = NexusGenObjects['ViewChangedPayload'];

export const ViewChanged = subscriptionField('viewChanged', {
    type: 'ViewState',
    subscribe: () => pubsub.asyncIterator(['VIEW_CHANGED']), // Lytter etter eventet VIEW_CHANGED
    // Payload burde være en union så man kan switche mellom states på frontenden med
    // on ...LOADING, on ...ENDED ---> vis dette
    resolve: (payload: ViewChangedPayload, __, ctx) => {
        const currentView = payload.viewState || 'LOADING';
        console.log(`CHANGED VIEW TO ${currentView}`);
        return currentView;
    },
});
