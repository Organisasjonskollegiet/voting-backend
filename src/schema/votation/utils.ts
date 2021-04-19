import { Participant } from '@prisma/client';
import { Context } from '../../context';

export const userHasVoted = async (ctx: Context, participant: Participant, votationId: string) => {
    const hasVoted = await ctx.prisma.hasVoted.findUnique({
        where: { participantId_votationId: { participantId: participant.id, votationId: votationId } },
    });
    return hasVoted !== null;
};

export const checkAlternativeExists = async (ctx: Context, alternativeId: string) => {
    const alternative = await ctx.prisma.alternative.findUnique({ where: { id: alternativeId } });
    return alternative !== null;
};
