import { mutationField, nonNull, stringArg } from 'nexus';
import { pubsub } from '../../lib/pubsub';
import { ViewState } from '../enums';

export const ChangeViewMutation = mutationField('changeView', {
    type: 'ViewState',
    // TODO: Legg inn mulighet for å sende inn mer data?
    args: { state: nonNull(ViewState) },
    resolve: async (_, { state }) => {
        // TODO: Sett payload dynamisk basert på hvilken view som skal vises
        // F.eks. ENDED view burde sende inn vinneren, mens CLOSED kan sende inn antall stemmer?
        await pubsub.publish(`VIEW_CHANGED`, { viewState: state }); // Payloader det andre argumentet
        return state;
    },
});
