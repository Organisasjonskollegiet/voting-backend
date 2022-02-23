import { Votation as VotationDbType } from '@prisma/client';
import { nonNull, stringArg, subscriptionField, objectType, list } from 'nexus';
import { pubsub } from '../../lib/pubsub';
import { NexusGenEnums } from '../../__generated__/nexus-typegen';
import { VotationStatus, VotationType } from '../enums';
import { Alternative } from './typedefs';

type VotationStatus = NexusGenEnums['VotationStatus'];

export const VotationWithAlternative = objectType({
    name: 'VotationWithAlternative',
    definition: (t) => {
        t.nonNull.id('id');
        t.nonNull.string('title');
        t.string('description');
        t.nonNull.field('status', { type: VotationStatus });
        t.nonNull.boolean('blankVotes');
        t.nonNull.boolean('hiddenVotes');
        t.nonNull.field('type', { type: VotationType });
        t.nonNull.int('numberOfWinners');
        t.nonNull.int('majorityThreshold');
        t.nonNull.int('index');
        t.nonNull.string('meetingId');
        t.list.field('alternatives', { type: Alternative });
    },
});

export const VotationStatusUpdatedResponse = objectType({
    name: 'VotationStatusUpdatedResponse',
    definition: (t) => {
        t.nonNull.string('votationId');
        t.nonNull.field('votationStatus', { type: 'VotationStatus' });
        t.string('reason');
    },
});

export const NewVoteRegisteredResponse = objectType({
    name: 'NewVoteRegisteredResponse',
    definition: (t) => {
        t.nonNull.string('votationId');
        t.nonNull.int('voteCount');
        t.nonNull.int('votingEligibleCount');
    },
});

export const NewVoteRegistered = subscriptionField('newVoteRegistered', {
    type: 'NewVoteRegisteredResponse',
    args: {
        votationId: nonNull(stringArg()),
    },
    subscribe: async (_, { votationId }, ___) => {
        return pubsub.asyncIterator([`NEW_VOTE_REGISTERED_FOR_${votationId}`]);
    },
    resolve: async (voteCount: { votationId: string; voteCount: number; votingEligibleCount: number }, __, ___) => {
        return voteCount;
    },
});

export const VotationStatusUpdated = subscriptionField('votationStatusUpdated', {
    type: 'VotationStatusUpdatedResponse',
    args: {
        id: nonNull(stringArg()),
    },
    subscribe: async (_, { id }, ___) => {
        return pubsub.asyncIterator([`VOTATION_STATUS_UPDATED_FOR_${id}`]);
    },
    resolve: async (status: { votationId: string; votationStatus: VotationStatus; reason: string }, __, ___) => {
        return status;
    },
});

export const ReviewAdded = subscriptionField('reviewAdded', {
    type: 'ReviewResult',
    args: {
        votationId: nonNull(stringArg()),
    },
    subscribe: async (_, { votationId }, ___) => {
        return pubsub.asyncIterator([`REVIEW_ADDED_FOR_${votationId}`]);
    },
    resolve: async (reviews: { approved: number; disapproved: number }, __, ctx) => {
        return reviews;
    },
});

export const VotationsUpdated = subscriptionField('votationsUpdated', {
    type: list(VotationWithAlternative),
    description: 'Returns the updated votations of a meeting.',
    args: {
        meetingId: nonNull(stringArg()),
    },
    subscribe: async (_, { meetingId }, ___) => {
        return pubsub.asyncIterator([`VOTATIONS_UPDATED_FOR_${meetingId}`]);
    },
    resolve: async (votations: VotationDbType[], __, ___) => {
        return votations;
    },
});

export const VotationDeleted = subscriptionField('votationDeleted', {
    type: 'String',
    args: {
        meetingId: nonNull(stringArg()),
    },
    subscribe: async (_, { meetingId }, ___) => {
        return pubsub.asyncIterator([`VOTATION_DELETED_${meetingId}`]);
    },
    resolve: async (votationId: string, __, ___) => {
        return votationId;
    },
});
