import { mutationField } from 'nexus';
import { ManagementClient } from 'auth0';

export const DeleteUserMutation = mutationField('deleteMe', {
    type: 'String',
    description: 'Delete your own user.',
    args: {},
    resolve: async (_, __, ctx) => {
        var auth0 = new ManagementClient({
            domain: process.env.AUTH0_DOMAIN!,
            clientId: 'wdRfxZqUoWxe7DFDTcx7bNvtnTfARDj0',
            clientSecret: 'IczbE0vqrCt49jCQAbfo_pUQXQnOeWDLcHCcrdoZQEkUaB7s4g-NF3BQPK1MsYGP',
            scope: 'delete:users',
        });

        return auth0
            .deleteUser({ id: `auth0|${ctx.userId}` })
            .then(() => {
                return 'Bruker slettet.';
            })
            .catch(() => {
                return 'Kunne ikke slette bruker.';
            });
    },
});
