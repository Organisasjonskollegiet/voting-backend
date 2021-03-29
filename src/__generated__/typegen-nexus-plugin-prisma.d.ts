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
  HasVoted: Prisma.HasVoted
  Votation: Prisma.Votation
  Alternative: Prisma.Alternative
  Vote: Prisma.Vote
}

// Prisma input types metadata
interface NexusPrismaInputs {
  Query: {
    users: {
      filtering: 'AND' | 'OR' | 'NOT' | 'id' | 'username' | 'email' | 'meetings' | 'votedAt' | 'participantAt'
      ordering: 'id' | 'username' | 'email'
    }
    meetings: {
      filtering: 'AND' | 'OR' | 'NOT' | 'id' | 'title' | 'startTime' | 'description' | 'owner' | 'ownerId' | 'votations' | 'status' | 'participants'
      ordering: 'id' | 'title' | 'startTime' | 'description' | 'ownerId' | 'status'
    }
    participants: {
      filtering: 'AND' | 'OR' | 'NOT' | 'role' | 'userId' | 'meetingId' | 'isVotingEligible' | 'user' | 'meeting'
      ordering: 'role' | 'userId' | 'meetingId' | 'isVotingEligible'
    }
    hasVoteds: {
      filtering: 'AND' | 'OR' | 'NOT' | 'userId' | 'votationId' | 'createdAt' | 'user' | 'votation'
      ordering: 'userId' | 'votationId' | 'createdAt'
    }
    votations: {
      filtering: 'AND' | 'OR' | 'NOT' | 'id' | 'title' | 'description' | 'order' | 'status' | 'blankVotes' | 'majorityType' | 'majorityThreshold' | 'meetingId' | 'meeting' | 'hasVoted' | 'alternatives'
      ordering: 'id' | 'title' | 'description' | 'order' | 'status' | 'blankVotes' | 'majorityType' | 'majorityThreshold' | 'meetingId'
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
    votedAt: {
      filtering: 'AND' | 'OR' | 'NOT' | 'userId' | 'votationId' | 'createdAt' | 'user' | 'votation'
      ordering: 'userId' | 'votationId' | 'createdAt'
    }
    participantAt: {
      filtering: 'AND' | 'OR' | 'NOT' | 'role' | 'userId' | 'meetingId' | 'isVotingEligible' | 'user' | 'meeting'
      ordering: 'role' | 'userId' | 'meetingId' | 'isVotingEligible'
    }
  }
  Meeting: {
    votations: {
      filtering: 'AND' | 'OR' | 'NOT' | 'id' | 'title' | 'description' | 'order' | 'status' | 'blankVotes' | 'majorityType' | 'majorityThreshold' | 'meetingId' | 'meeting' | 'hasVoted' | 'alternatives'
      ordering: 'id' | 'title' | 'description' | 'order' | 'status' | 'blankVotes' | 'majorityType' | 'majorityThreshold' | 'meetingId'
    }
    participants: {
      filtering: 'AND' | 'OR' | 'NOT' | 'role' | 'userId' | 'meetingId' | 'isVotingEligible' | 'user' | 'meeting'
      ordering: 'role' | 'userId' | 'meetingId' | 'isVotingEligible'
    }
  }
  Participant: {

  }
  HasVoted: {

  }
  Votation: {
    hasVoted: {
      filtering: 'AND' | 'OR' | 'NOT' | 'userId' | 'votationId' | 'createdAt' | 'user' | 'votation'
      ordering: 'userId' | 'votationId' | 'createdAt'
    }
    alternatives: {
      filtering: 'AND' | 'OR' | 'NOT' | 'id' | 'text' | 'votationId' | 'votation' | 'votes'
      ordering: 'id' | 'text' | 'votationId'
    }
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
    hasVoted: 'HasVoted'
    hasVoteds: 'HasVoted'
    votation: 'Votation'
    votations: 'Votation'
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
    createOneHasVoted: 'HasVoted'
    updateOneHasVoted: 'HasVoted'
    updateManyHasVoted: 'AffectedRowsOutput'
    deleteOneHasVoted: 'HasVoted'
    deleteManyHasVoted: 'AffectedRowsOutput'
    upsertOneHasVoted: 'HasVoted'
    createOneVotation: 'Votation'
    updateOneVotation: 'Votation'
    updateManyVotation: 'AffectedRowsOutput'
    deleteOneVotation: 'Votation'
    deleteManyVotation: 'AffectedRowsOutput'
    upsertOneVotation: 'Votation'
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
    username: 'String'
    email: 'String'
    meetings: 'Meeting'
    votedAt: 'HasVoted'
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
    role: 'Role'
    userId: 'String'
    meetingId: 'String'
    isVotingEligible: 'Boolean'
    user: 'User'
    meeting: 'Meeting'
  }
  HasVoted: {
    userId: 'String'
    votationId: 'String'
    createdAt: 'DateTime'
    user: 'User'
    votation: 'Votation'
  }
  Votation: {
    id: 'String'
    title: 'String'
    description: 'String'
    order: 'Int'
    status: 'Status'
    blankVotes: 'Boolean'
    majorityType: 'MajorityType'
    majorityThreshold: 'Int'
    meetingId: 'String'
    meeting: 'Meeting'
    hasVoted: 'HasVoted'
    alternatives: 'Alternative'
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
  HasVoted: Typegen.NexusPrismaFields<'HasVoted'>
  Votation: Typegen.NexusPrismaFields<'Votation'>
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
  