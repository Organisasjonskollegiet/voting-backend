import { mutationField } from 'nexus';
import { ManagementClient } from 'auth0';
import { VotationStatus } from '@prisma/client';
import { pubsub } from '../../lib/pubsub';
import { print } from 'graphql';

export const DeleteUserMutation = mutationField('deleteMe', {
    type: 'String',
    description: 'Delete your own user.',
    args: {},
    resolve: async (_, __, ctx) => {
        const auth0 = new ManagementClient({
            domain: process.env.AUTH0_DOMAIN!,
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            scope: 'read:users delete:users',
        });

        const auth0Users = await auth0.getUsers({
            q: `email:"${ctx.email}" AND identities.connection:"Username-Password-Authentication"`,
            search_engine: 'v3',
        });

        if (!auth0Users || auth0Users.length === 0) {
            console.log('Auth0 user not found');
        }

        const auth0User = auth0Users[0];

        if (!auth0User || !auth0User.user_id) {
            throw new Error('User not found or user_id is missing');
        }

        return auth0
            .deleteUser({ id: auth0User.user_id })
            .then(async () => {
                // invalidate all open votations where this user is participant
                const votationsToInvalidate = await ctx.prisma.votation.findMany({
                    where: {
                        meeting: {
                            participants: {
                                some: {
                                    userId: ctx.userId,
                                },
                            },
                        },
                        status: VotationStatus.OPEN,
                    },
                    select: {
                        id: true,
                    },
                });
                await ctx.prisma.votation.updateMany({
                    where: {
                        id: { in: votationsToInvalidate.map((v) => v.id) },
                    },
                    data: {
                        status: VotationStatus.INVALID,
                    },
                });
                const publishPromises: Promise<void>[] = [];
                votationsToInvalidate.forEach((votation) => {
                    publishPromises.push(
                        pubsub.publish(`VOTATION_STATUS_UPDATED_FOR_${votation.id}`, {
                            votationId: votation.id,
                            votationStatus: VotationStatus.INVALID,
                            reason: 'Voteringen ble avbrutt ettersom en bruker som deltok i møtet ble slettet mens voteringen pågikk. Det kunne ført til feil resultat.',
                        })
                    );
                });
                await Promise.all(publishPromises);
                return 'Bruker slettet.';
            })
            .catch((e) => {
                console.log('Kunne ikke slette bruker.');
                console.log(e);
                return 'Kunne ikke slette bruker.';
            });
    },
});
