import * as Typegen from 'nexus-plugin-prisma/typegen'
import * as Prisma from '@prisma/client';

// Pagination type
type Pagination = {
    first?: boolean
    last?: boolean
    before?: boolean
    after?: boolean
}

// Prisma custom scalar names
type CustomScalars = 'DateTime'

// Prisma model type definitions
interface PrismaModels {
  User: Prisma.User
  Meeting: Prisma.Meeting
  Participant: Prisma.Participant
  Votation: Prisma.Votation
  HasVoted: Prisma.HasVoted
  Alternative: Prisma.Alternative
  Vote: Prisma.Vote
}

// Prisma input types metadata
interface NexusPrismaInputs {
  Query: {
    users: {
      filtering: 'AND' | 'OR' | 'NOT' | 'id' | 'email' | 'emailVerified' | 'password' | 'meetings' | 'participantAt'
      ordering: 'id' | 'email' | 'emailVerified' | 'password'
    }
    meetings: {
      filtering: 'AND' | 'OR' | 'NOT' | 'id' | 'title' | 'startTime' | 'description' | 'owner' | 'ownerId' | 'votations' | 'status' | 'participants'
      ordering: 'id' | 'title' | 'startTime' | 'description' | 'ownerId' | 'status'
    }
    participants: {
      filtering: 'AND' | 'OR' | 'NOT' | 'id' | 'role' | 'userId' | 'meetingId' | 'isVotingEligible' | 'user' | 'meeting' | 'HasVoted'
      ordering: 'id' | 'role' | 'userId' | 'meetingId' | 'isVotingEligible'
    }
    votations: {
      filtering: 'AND' | 'OR' | 'NOT' | 'id' | 'title' | 'description' | 'status' | 'blankVotes' | 'majorityType' | 'majorityThreshold' | 'meetingId' | 'meeting' | 'alternatives' | 'HasVoted'
      ordering: 'id' | 'title' | 'description' | 'status' | 'blankVotes' | 'majorityType' | 'majorityThreshold' | 'meetingId'
    }
    hasVoteds: {
      filtering: 'AND' | 'OR' | 'NOT' | 'votationId' | 'participantId' | 'createdAt' | 'votation' | 'participant'
      ordering: 'votationId' | 'participantId' | 'createdAt'
    }
    alternatives: {
      filtering: 'AND' | 'OR' | 'NOT' | 'id' | 'text' | 'votationId' | 'votation' | 'votes'
      ordering: 'id' | 'text' | 'votationId'
    }
    votes: {
      filtering: 'AND' | 'OR' | 'NOT' | 'id' | 'alternative' | 'alternativeId' | 'nextVoteId' | 'nextVote' | 'prevVote'
      ordering: 'id' | 'alternativeId' | 'nextVoteId'
    }
  },
  User: {
    meetings: {
      filtering: 'AND' | 'OR' | 'NOT' | 'id' | 'title' | 'startTime' | 'description' | 'owner' | 'ownerId' | 'votations' | 'status' | 'participants'
      ordering: 'id' | 'title' | 'startTime' | 'description' | 'ownerId' | 'status'
    }
    participantAt: {
      filtering: 'AND' | 'OR' | 'NOT' | 'id' | 'role' | 'userId' | 'meetingId' | 'isVotingEligible' | 'user' | 'meeting' | 'HasVoted'
      ordering: 'id' | 'role' | 'userId' | 'meetingId' | 'isVotingEligible'
    }
  }
  Meeting: {
    votations: {
      filtering: 'AND' | 'OR' | 'NOT' | 'id' | 'title' | 'description' | 'status' | 'blankVotes' | 'majorityType' | 'majorityThreshold' | 'meetingId' | 'meeting' | 'alternatives' | 'HasVoted'
      ordering: 'id' | 'title' | 'description' | 'status' | 'blankVotes' | 'majorityType' | 'majorityThreshold' | 'meetingId'
    }
    participants: {
      filtering: 'AND' | 'OR' | 'NOT' | 'id' | 'role' | 'userId' | 'meetingId' | 'isVotingEligible' | 'user' | 'meeting' | 'HasVoted'
      ordering: 'id' | 'role' | 'userId' | 'meetingId' | 'isVotingEligible'
    }
  }
  Participant: {
    HasVoted: {
      filtering: 'AND' | 'OR' | 'NOT' | 'votationId' | 'participantId' | 'createdAt' | 'votation' | 'participant'
      ordering: 'votationId' | 'participantId' | 'createdAt'
    }
  }
  Votation: {
    alternatives: {
      filtering: 'AND' | 'OR' | 'NOT' | 'id' | 'text' | 'votationId' | 'votation' | 'votes'
      ordering: 'id' | 'text' | 'votationId'
    }
    HasVoted: {
      filtering: 'AND' | 'OR' | 'NOT' | 'votationId' | 'participantId' | 'createdAt' | 'votation' | 'participant'
      ordering: 'votationId' | 'participantId' | 'createdAt'
    }
  }
  HasVoted: {

  }
  Alternative: {
    votes: {
      filtering: 'AND' | 'OR' | 'NOT' | 'id' | 'alternative' | 'alternativeId' | 'nextVoteId' | 'nextVote' | 'prevVote'
      ordering: 'id' | 'alternativeId' | 'nextVoteId'
    }
  }
  Vote: {

  }
}

// Prisma output types metadata
interface NexusPrismaOutputs {
  Query: {
    user: 'User'
    users: 'User'
    meeting: 'Meeting'
    meetings: 'Meeting'
    participant: 'Participant'
    participants: 'Participant'
    votation: 'Votation'
    votations: 'Votation'
    hasVoted: 'HasVoted'
    hasVoteds: 'HasVoted'
    alternative: 'Alternative'
    alternatives: 'Alternative'
    vote: 'Vote'
    votes: 'Vote'
  },
  Mutation: {
    createOneUser: 'User'
    updateOneUser: 'User'
    updateManyUser: 'AffectedRowsOutput'
    deleteOneUser: 'User'
    deleteManyUser: 'AffectedRowsOutput'
    upsertOneUser: 'User'
    createOneMeeting: 'Meeting'
    updateOneMeeting: 'Meeting'
    updateManyMeeting: 'AffectedRowsOutput'
    deleteOneMeeting: 'Meeting'
    deleteManyMeeting: 'AffectedRowsOutput'
    upsertOneMeeting: 'Meeting'
    createOneParticipant: 'Participant'
    updateOneParticipant: 'Participant'
    updateManyParticipant: 'AffectedRowsOutput'
    deleteOneParticipant: 'Participant'
    deleteManyParticipant: 'AffectedRowsOutput'
    upsertOneParticipant: 'Participant'
    createOneVotation: 'Votation'
    updateOneVotation: 'Votation'
    updateManyVotation: 'AffectedRowsOutput'
    deleteOneVotation: 'Votation'
    deleteManyVotation: 'AffectedRowsOutput'
    upsertOneVotation: 'Votation'
    createOneHasVoted: 'HasVoted'
    updateOneHasVoted: 'HasVoted'
    updateManyHasVoted: 'AffectedRowsOutput'
    deleteOneHasVoted: 'HasVoted'
    deleteManyHasVoted: 'AffectedRowsOutput'
    upsertOneHasVoted: 'HasVoted'
    createOneAlternative: 'Alternative'
    updateOneAlternative: 'Alternative'
    updateManyAlternative: 'AffectedRowsOutput'
    deleteOneAlternative: 'Alternative'
    deleteManyAlternative: 'AffectedRowsOutput'
    upsertOneAlternative: 'Alternative'
    createOneVote: 'Vote'
    updateOneVote: 'Vote'
    updateManyVote: 'AffectedRowsOutput'
    deleteOneVote: 'Vote'
    deleteManyVote: 'AffectedRowsOutput'
    upsertOneVote: 'Vote'
  },
  User: {
    id: 'String'
    email: 'String'
    emailVerified: 'Boolean'
    password: 'String'
    meetings: 'Meeting'
    participantAt: 'Participant'
  }
  Meeting: {
    id: 'String'
    title: 'String'
    startTime: 'DateTime'
    description: 'String'
    owner: 'User'
    ownerId: 'String'
    votations: 'Votation'
    status: 'Status'
    participants: 'Participant'
  }
  Participant: {
    id: 'String'
    role: 'Role'
    userId: 'String'
    meetingId: 'String'
    isVotingEligible: 'Boolean'
    user: 'User'
    meeting: 'Meeting'
    HasVoted: 'HasVoted'
  }
  Votation: {
    id: 'String'
    title: 'String'
    description: 'String'
    status: 'Status'
    blankVotes: 'Boolean'
    majorityType: 'MajorityType'
    majorityThreshold: 'Int'
    meetingId: 'String'
    meeting: 'Meeting'
    alternatives: 'Alternative'
    HasVoted: 'HasVoted'
  }
  HasVoted: {
    votationId: 'String'
    participantId: 'String'
    createdAt: 'DateTime'
    votation: 'Votation'
    participant: 'Participant'
  }
  Alternative: {
    id: 'String'
    text: 'String'
    votationId: 'String'
    votation: 'Votation'
    votes: 'Vote'
  }
  Vote: {
    id: 'String'
    alternative: 'Alternative'
    alternativeId: 'String'
    nextVoteId: 'String'
    nextVote: 'Vote'
    prevVote: 'Vote'
  }
}

// Helper to gather all methods relative to a model
interface NexusPrismaMethods {
  User: Typegen.NexusPrismaFields<'User'>
  Meeting: Typegen.NexusPrismaFields<'Meeting'>
  Participant: Typegen.NexusPrismaFields<'Participant'>
  Votation: Typegen.NexusPrismaFields<'Votation'>
  HasVoted: Typegen.NexusPrismaFields<'HasVoted'>
  Alternative: Typegen.NexusPrismaFields<'Alternative'>
  Vote: Typegen.NexusPrismaFields<'Vote'>
  Query: Typegen.NexusPrismaFields<'Query'>
  Mutation: Typegen.NexusPrismaFields<'Mutation'>
}

interface NexusPrismaGenTypes {
  inputs: NexusPrismaInputs
  outputs: NexusPrismaOutputs
  methods: NexusPrismaMethods
  models: PrismaModels
  pagination: Pagination
  scalars: CustomScalars
}

declare global {
  interface NexusPrismaGen extends NexusPrismaGenTypes {}

  type NexusPrisma<
    TypeName extends string,
    ModelOrCrud extends 'model' | 'crud'
  > = Typegen.GetNexusPrisma<TypeName, ModelOrCrud>;
}
  