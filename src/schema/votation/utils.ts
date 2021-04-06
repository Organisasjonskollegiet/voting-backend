import { Context } from '../../context';

export const userHasVoted = async (ctx: Context, votationId: string) => {
    const hasVoted = await ctx.prisma.hasVoted.findFirst({ where: { votationId, userId: ctx.user.id } });
    return hasVoted !== null;
};

export const checkAlternativeExists = async (ctx: Context, alternativeId: string) => {
    const alternative = await ctx.prisma.alternative.findUnique({ where: { id: alternativeId } });
    return alternative !== null;
};
