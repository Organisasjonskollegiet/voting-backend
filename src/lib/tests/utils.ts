import { VotationStatus, MeetingStatus, VotationType, Role, Alternative, Vote } from '.prisma/client';
import { TestContext } from './testContext';
import casual from 'casual';

export interface StaticMeetingDataType {
    organization: string;
    title: string;
    startTime: string;
    description: string;
    status: MeetingStatus;
    allowSelfRegistration: boolean;
}

export interface StaticVotationDataType {
    title: string;
    description: string;
    blankVotes: boolean;
    hiddenVotes: boolean;
    type?: VotationType;
    numberOfWinners: number;
    majorityThreshold?: number;
}

export const staticMeetingData: StaticMeetingDataType = {
    organization: 'organization',
    title: 'test title',
    startTime: '2021-04-13T11:29:58.000Z',
    description: 'test description',
    status: MeetingStatus.UPCOMING,
    allowSelfRegistration: false,
};

export const updatedMeetingData: StaticMeetingDataType = {
    title: 'new title',
    organization: 'Junior Consulting AS',
    startTime: '2021-05-13T14:06:30.000Z',
    description: 'New description',
    status: MeetingStatus.ONGOING,
    allowSelfRegistration: true,
};

export const staticVotationData: StaticVotationDataType = {
    title: 'test votation title',
    description: 'test votation description',
    blankVotes: true,
    hiddenVotes: true,
    numberOfWinners: 1,
};

export const updatedStaticVotationData: StaticVotationDataType = {
    title: 'updated votation title',
    description: 'updated votation description',
    blankVotes: false,
    hiddenVotes: false,
    type: VotationType.QUALIFIED,
    numberOfWinners: 2,
    majorityThreshold: 67,
};

export const alternative1Text = 'alternative1 text';

export const alternative2Text = 'alternative2 text';

export const createMeeting = async (
    ctx: TestContext,
    ownerId: string,
    role: Role,
    isVotingEligible: boolean,
    allowSelfRegistration?: boolean
) => {
    return await ctx.prisma.meeting.create({
        data: {
            ...staticMeetingData,
            ownerId: ownerId,
            allowSelfRegistration: allowSelfRegistration ?? false,
            participants: {
                create: {
                    userId: ownerId,
                    role: role,
                    isVotingEligible: isVotingEligible,
                },
            },
        },
    });
};

export const createVotation = async (
    ctx: TestContext,
    meetingId: string,
    status: VotationStatus,
    index: number,
    type: VotationType = VotationType.SIMPLE,
    numberOfWinners: number = 1,
    majorityThreshold: number = 66,
    blankVotes = false,
    hiddenVotes = true
) => {
    return await ctx.prisma.votation.create({
        data: {
            ...staticVotationData,
            type,
            majorityThreshold,
            status: status,
            index,
            meetingId,
            numberOfWinners,
            blankVotes,
            hiddenVotes,
        },
    });
};

export const createAlternative = async (
    ctx: TestContext,
    votationId: string,
    text: string,
    isWinner?: boolean,
    index?: number
) => {
    return ctx.prisma.alternative.create({
        data: {
            text,
            votationId,
            isWinner,
            index,
        },
    });
};

export const createUser = async (ctx: TestContext) => {
    return await ctx.prisma.user.create({
        data: {
            email: casual.email,
            password: casual.password,
        },
    });
};

export const createParticipant = async (
    ctx: TestContext,
    meetingId: string,
    userId: string,
    isVotingEligible: boolean,
    role: Role
) => {
    return await ctx.prisma.participant.create({
        data: { meetingId, userId, isVotingEligible, role },
    });
};

export const vote = async (ctx: TestContext, votationId: string, userId: string, alternativeId: string) => {
    await ctx.prisma.$transaction([
        ctx.prisma.hasVoted.create({ data: { votationId, userId } }),
        ctx.prisma.vote.create({ data: { alternativeId } }),
    ]);
};

export const castStvVote = async (
    ctx: TestContext,
    votationId: string,
    alternatives: { id: string; ranking: number }[],
    userId: string
) => {
    const stv = await ctx.prisma.stvVote.create({
        data: {
            votationId,
        },
    });
    await ctx.prisma.hasVoted.create({
        data: {
            userId,
            votationId,
        },
    });
    const promises: Promise<Vote>[] = [];
    alternatives.forEach((a) =>
        promises.push(
            new Promise(async (resolve, reject) => {
                try {
                    const vote = await ctx.prisma.vote.create({
                        data: {
                            stvVoteId: stv.id,
                            alternativeId: a.id,
                            ranking: a.ranking,
                        },
                    });
                    resolve(vote);
                } catch (error) {
                    reject(error);
                }
            })
        )
    );
    return await Promise.all(promises);
};

export const formatVotationToCompare = (votation: any) => {
    return {
        title: votation.title,
        description: votation.description,
        blankVotes: votation.blankVotes,
        hiddenVotes: votation.hiddenVotes,
        type: votation.type,
        majorityThreshold: votation.majorityThreshold,
        index: votation.index,
    };
};

export const createReview = async (ctx: TestContext, votationId: string, participantId: string, approved: boolean) => {
    return await ctx.prisma.votationResultReview.create({
        data: {
            votationId,
            participantId,
            approved,
        },
    });
};
