import { idArg, list, nonNull, queryField, stringArg } from 'nexus';
import { Alternative, Votation } from './typedefs';

export const GetVotationById = queryField('votationById', {
    type: Votation,
    args: {
        votationId: nonNull(idArg()),
    },
    resolve: async (_, { votationId }, ctx) => {
        const votation = await ctx.prisma.votation.findUnique({ where: { id: votationId } });
        if (!votation) throw new Error('Error fetching votation from database');
        return votation;
    },
});

export const AlternativesByVotation = queryField('alternativesByVotation', {
    type: list(Alternative),
    args: {
        votationId: nonNull(stringArg()),
    },
    resolve: async (_, { votationId }, ctx) => {
        const alternatives = await ctx.prisma.alternative.findMany({ where: { votationId } });
        if (!alternatives)
            throw new Error('There is no alternatives for this votation, or the votation does not exist.');
        return alternatives;
    },
});
