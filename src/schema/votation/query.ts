import { list, nonNull, queryField, stringArg } from 'nexus';
import { Votation, Alternative } from './typedefs';

export const VotationsByMeetingQuery = queryField('votationsByMeeting', {
    type: list(Votation),
    args: {
        meetingId: nonNull(stringArg()),
    },
    resolve: (_, { meetingId }, ctx) => {
        return ctx.prisma.votation.findMany({ where: { meetingId } });
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

export const NumberOfVotesPerAlternativeByVotation = queryField('alternativesByVotation', {
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
