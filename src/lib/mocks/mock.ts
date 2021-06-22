import { Role, Status } from '@prisma/client';
import casual from 'casual';

const simpleMock = {
    User: () => ({
        id: () => casual.uuid,
        email: () => casual.email,
        emailVerified: () => casual.boolean,
    }),
    Meeting: () => ({
        id: () => casual.uuid,
        title: () => casual.title,
        startTime: () => casual.date('YYYY-MM-DDTHH:mm:ssZ'),
        description: () => casual.text,
        owner: () => ({ __typename: 'User' }),
        participants: () => new Array(casual.integer(2, 6)).fill({ __typename: 'Participant' }),
        votations: () => new Array(casual.integer(2, 6)).fill({ __typename: 'Votation' }),
        status: () => [Status.ENDED, Status.ONGOING, Status.UPCOMING][casual.integer(0, 2)],
        organization: () => casual._company_name(),
    }),
    Votation: () => ({
        id: () => casual.uuid,
        meetingId: () => casual.uuid,
        title: () => casual.title,
        blankVotes: () => casual.boolean,
        description: () => casual.text,
        hasVoted: () => new Array(casual.integer(2, 6)).fill({ __typename: 'User' }),
        majorityThreshold: () => casual.integer(40, 80),
        order: () => casual.integer,
        status: () => [Status.ONGOING, Status.UPCOMING, Status.ENDED][casual.integer(0, 2)],
        alternatives: () => new Array(casual.integer(2, 6)).fill({ __typename: 'Alternative' }),
        hiddenVotes: () => casual.boolean,
        severalVotes: () => casual.boolean,
    }),
    Alternative: () => ({
        id: () => casual.uuid,
        text: () => casual._full_name(),
        votationId: () => casual.uuid,
        votes: () => casual.integer(0, 100),
    }),
    Participant: () => ({
        isVotingEligible: () => casual.boolean,
        role: () => [Role.PARTICIPANT, Role.COUNTER, Role.ADMIN][casual.integer(0, 2)],
        user: () => ({ __typename: 'User' }),
    }),
    Query: () => ({
        user: () => ({ __typename: 'User' }),
        meetings: () => new Array(casual.integer(2, 6)).fill({ __typename: 'Meeting' }),
        meetingsById: () => ({ __typename: 'Meeting' }),
        alternativesByVotation: () => new Array(casual.integer(2, 6)).fill({ __typename: 'Alternative' }),
    }),
};

export default simpleMock;
