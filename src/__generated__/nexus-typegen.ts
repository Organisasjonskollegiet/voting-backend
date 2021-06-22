/**
 * This file was generated by Nexus Schema
 * Do not make changes to this file directly
 */


import { Context } from "./../context"
import { core } from "nexus"
declare global {
  interface NexusGenCustomInputMethods<TypeName extends string> {
    /**
     * A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.
     */
    datetime<FieldName extends string>(fieldName: FieldName, opts?: core.CommonInputFieldConfig<TypeName, FieldName>): void // "DateTime";
  }
}
declare global {
  interface NexusGenCustomOutputMethods<TypeName extends string> {
    /**
     * A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.
     */
    datetime<FieldName extends string>(fieldName: FieldName, ...opts: core.ScalarOutSpread<TypeName, FieldName>): void // "DateTime";
  }
}


declare global {
  interface NexusGen extends NexusGenTypes {}
}

export interface NexusGenInputs {
  CreateMeetingInput: { // input type
    description: string; // String!
    organization: string; // String!
    startTime: NexusGenScalars['DateTime']; // DateTime!
    title: string; // String!
  }
  CreateVotationInput: { // input type
    alternatives?: string[] | null; // [String!]
    blankVotes: boolean; // Boolean!
    description: string; // String!
    hiddenVotes: boolean; // Boolean!
    majorityThreshold: number; // Int!
    majorityType: NexusGenEnums['MajorityType']; // MajorityType!
    severalVotes: boolean; // Boolean!
    title: string; // String!
  }
  UpdateMeetingInput: { // input type
    description?: string | null; // String
    id: string; // String!
    organization?: string | null; // String
    startTime?: NexusGenScalars['DateTime'] | null; // DateTime
    status?: NexusGenEnums['Status'] | null; // Status
    title?: string | null; // String
  }
  UpdateVotationInput: { // input type
    blankVotes: boolean; // Boolean!
    description: string; // String!
    hiddenVotes: boolean; // Boolean!
    id: string; // String!
    majorityThreshold: number; // Int!
    majorityType: NexusGenEnums['MajorityType']; // MajorityType!
    severalVotes: boolean; // Boolean!
    title: string; // String!
  }
  UpdateVotationStatusInput: { // input type
    id: string; // String!
    status: NexusGenEnums['Status']; // Status!
  }
}

export interface NexusGenEnums {
  MajorityType: "QUALIFIED" | "SIMPLE"
  Role: "ADMIN" | "COUNTER" | "PARTICIPANT"
  Status: "ENDED" | "ONGOING" | "UPCOMING"
}

export interface NexusGenScalars {
  String: string
  Int: number
  Float: number
  Boolean: boolean
  ID: string
  DateTime: any
}

export interface NexusGenObjects {
  Alternative: { // root type
    id: string; // ID!
    text: string; // String!
    votationId: string; // String!
  }
  Meeting: { // root type
    description?: string | null; // String
    id: string; // ID!
    organization: string; // String!
    startTime: NexusGenScalars['DateTime']; // DateTime!
    status: NexusGenEnums['Status']; // Status!
    title: string; // String!
  }
  Mutation: {};
  OwnerCannotBeRemovedFromParticipantError: { // root type
    message: string; // String!
  }
  Participant: { // root type
    isVotingEligible: boolean; // Boolean!
    role: NexusGenEnums['Role']; // Role!
  }
  Query: {};
  User: { // root type
    email: string; // String!
    emailVerified: boolean; // Boolean!
    id: string; // ID!
  }
  UserNotFoundError: { // root type
    message: string; // String!
  }
  Votation: { // root type
    blankVotes: boolean; // Boolean!
    description: string; // String!
    hasVoted?: Array<NexusGenRootTypes['User'] | null> | null; // [User]
    hiddenVotes: boolean; // Boolean!
    id: string; // ID!
    majorityThreshold: number; // Int!
    majorityType: NexusGenEnums['MajorityType']; // MajorityType!
    meetingId: string; // String!
    order?: number | null; // Int
    severalVotes: boolean; // Boolean!
    status: NexusGenEnums['Status']; // Status!
    title: string; // String!
  }
  Vote: { // root type
    alternativeId: string; // String!
    id: string; // ID!
    nextVoteId?: string | null; // String
  }
}

export interface NexusGenInterfaces {
}

export interface NexusGenUnions {
  DeleteParticipantResult: core.Discriminate<'OwnerCannotBeRemovedFromParticipantError', 'required'> | core.Discriminate<'Participant', 'required'>;
  GetUserResult: core.Discriminate<'User', 'required'> | core.Discriminate<'UserNotFoundError', 'required'>;
}

export type NexusGenRootTypes = NexusGenObjects & NexusGenUnions

export type NexusGenAllTypes = NexusGenRootTypes & NexusGenScalars & NexusGenEnums

export interface NexusGenFieldTypes {
  Alternative: { // field return type
    id: string; // ID!
    text: string; // String!
    votationId: string; // String!
    votes: number | null; // Int
  }
  Meeting: { // field return type
    description: string | null; // String
    id: string; // ID!
    organization: string; // String!
    owner: NexusGenRootTypes['User'] | null; // User
    participants: Array<NexusGenRootTypes['Participant'] | null>; // [Participant]!
    startTime: NexusGenScalars['DateTime']; // DateTime!
    status: NexusGenEnums['Status']; // Status!
    title: string; // String!
    votations: Array<NexusGenRootTypes['Votation'] | null> | null; // [Votation]
  }
  Mutation: { // field return type
    castVote: NexusGenRootTypes['Vote'] | null; // Vote
    createAlternative: NexusGenRootTypes['Alternative'] | null; // Alternative
    createMeeting: NexusGenRootTypes['Meeting'] | null; // Meeting
    createVotations: Array<string | null> | null; // [String]
    deleteAlternative: NexusGenRootTypes['Alternative'] | null; // Alternative
    deleteMeeting: NexusGenRootTypes['Meeting'] | null; // Meeting
    deleteParticipant: NexusGenRootTypes['DeleteParticipantResult'] | null; // DeleteParticipantResult
    deleteVotation: NexusGenRootTypes['Votation'] | null; // Votation
    updateAlternative: NexusGenRootTypes['Alternative'] | null; // Alternative
    updateMeeting: NexusGenRootTypes['Meeting'] | null; // Meeting
    updateVotation: NexusGenRootTypes['Votation'] | null; // Votation
    updateVotationStatus: NexusGenRootTypes['Votation'] | null; // Votation
  }
  OwnerCannotBeRemovedFromParticipantError: { // field return type
    message: string; // String!
  }
  Participant: { // field return type
    isVotingEligible: boolean; // Boolean!
    role: NexusGenEnums['Role']; // Role!
    user: NexusGenRootTypes['User'] | null; // User
  }
  Query: { // field return type
    alternativesByVotation: Array<NexusGenRootTypes['Alternative'] | null> | null; // [Alternative]
    meetings: Array<NexusGenRootTypes['Meeting'] | null>; // [Meeting]!
    meetingsById: NexusGenRootTypes['Meeting'] | null; // Meeting
    user: NexusGenRootTypes['GetUserResult'] | null; // GetUserResult
    votationById: NexusGenRootTypes['Votation'] | null; // Votation
  }
  User: { // field return type
    email: string; // String!
    emailVerified: boolean; // Boolean!
    id: string; // ID!
  }
  UserNotFoundError: { // field return type
    message: string; // String!
  }
  Votation: { // field return type
    alternatives: Array<NexusGenRootTypes['Alternative'] | null> | null; // [Alternative]
    blankVotes: boolean; // Boolean!
    description: string; // String!
    hasVoted: Array<NexusGenRootTypes['User'] | null> | null; // [User]
    hiddenVotes: boolean; // Boolean!
    id: string; // ID!
    majorityThreshold: number; // Int!
    majorityType: NexusGenEnums['MajorityType']; // MajorityType!
    meetingId: string; // String!
    order: number | null; // Int
    severalVotes: boolean; // Boolean!
    status: NexusGenEnums['Status']; // Status!
    title: string; // String!
  }
  Vote: { // field return type
    alternative: NexusGenRootTypes['Alternative'] | null; // Alternative
    alternativeId: string; // String!
    id: string; // ID!
    nextVote: NexusGenRootTypes['Vote'] | null; // Vote
    nextVoteId: string | null; // String
    prevVote: NexusGenRootTypes['Vote'] | null; // Vote
  }
}

export interface NexusGenFieldTypeNames {
  Alternative: { // field return type name
    id: 'ID'
    text: 'String'
    votationId: 'String'
    votes: 'Int'
  }
  Meeting: { // field return type name
    description: 'String'
    id: 'ID'
    organization: 'String'
    owner: 'User'
    participants: 'Participant'
    startTime: 'DateTime'
    status: 'Status'
    title: 'String'
    votations: 'Votation'
  }
  Mutation: { // field return type name
    castVote: 'Vote'
    createAlternative: 'Alternative'
    createMeeting: 'Meeting'
    createVotations: 'String'
    deleteAlternative: 'Alternative'
    deleteMeeting: 'Meeting'
    deleteParticipant: 'DeleteParticipantResult'
    deleteVotation: 'Votation'
    updateAlternative: 'Alternative'
    updateMeeting: 'Meeting'
    updateVotation: 'Votation'
    updateVotationStatus: 'Votation'
  }
  OwnerCannotBeRemovedFromParticipantError: { // field return type name
    message: 'String'
  }
  Participant: { // field return type name
    isVotingEligible: 'Boolean'
    role: 'Role'
    user: 'User'
  }
  Query: { // field return type name
    alternativesByVotation: 'Alternative'
    meetings: 'Meeting'
    meetingsById: 'Meeting'
    user: 'GetUserResult'
    votationById: 'Votation'
  }
  User: { // field return type name
    email: 'String'
    emailVerified: 'Boolean'
    id: 'ID'
  }
  UserNotFoundError: { // field return type name
    message: 'String'
  }
  Votation: { // field return type name
    alternatives: 'Alternative'
    blankVotes: 'Boolean'
    description: 'String'
    hasVoted: 'User'
    hiddenVotes: 'Boolean'
    id: 'ID'
    majorityThreshold: 'Int'
    majorityType: 'MajorityType'
    meetingId: 'String'
    order: 'Int'
    severalVotes: 'Boolean'
    status: 'Status'
    title: 'String'
  }
  Vote: { // field return type name
    alternative: 'Alternative'
    alternativeId: 'String'
    id: 'ID'
    nextVote: 'Vote'
    nextVoteId: 'String'
    prevVote: 'Vote'
  }
}

export interface NexusGenArgTypes {
  Mutation: {
    castVote: { // args
      alternativeId: string; // String!
      votationId: string; // String!
    }
    createAlternative: { // args
      text: string; // String!
      votationId: string; // String!
    }
    createMeeting: { // args
      meeting: NexusGenInputs['CreateMeetingInput']; // CreateMeetingInput!
    }
    createVotations: { // args
      meetingId: string; // String!
      votations: NexusGenInputs['CreateVotationInput'][]; // [CreateVotationInput!]!
    }
    deleteAlternative: { // args
      id: string; // String!
    }
    deleteMeeting: { // args
      id: string; // String!
    }
    deleteParticipant: { // args
      meetingId: string; // String!
      userId: string; // String!
    }
    deleteVotation: { // args
      id: string; // String!
    }
    updateAlternative: { // args
      id: string; // String!
      text: string; // String!
    }
    updateMeeting: { // args
      meeting: NexusGenInputs['UpdateMeetingInput']; // UpdateMeetingInput!
    }
    updateVotation: { // args
      votation: NexusGenInputs['UpdateVotationInput']; // UpdateVotationInput!
    }
    updateVotationStatus: { // args
      votation: NexusGenInputs['UpdateVotationStatusInput']; // UpdateVotationStatusInput!
    }
  }
  Query: {
    alternativesByVotation: { // args
      votationId: string; // String!
    }
    meetingsById: { // args
      meetingId: string; // String!
    }
    votationById: { // args
      votationId: string; // String!
    }
  }
}

export interface NexusGenAbstractTypeMembers {
  DeleteParticipantResult: "OwnerCannotBeRemovedFromParticipantError" | "Participant"
  GetUserResult: "User" | "UserNotFoundError"
}

export interface NexusGenTypeInterfaces {
}

export type NexusGenObjectNames = keyof NexusGenObjects;

export type NexusGenInputNames = keyof NexusGenInputs;

export type NexusGenEnumNames = keyof NexusGenEnums;

export type NexusGenInterfaceNames = never;

export type NexusGenScalarNames = keyof NexusGenScalars;

export type NexusGenUnionNames = keyof NexusGenUnions;

export type NexusGenObjectsUsingAbstractStrategyIsTypeOf = never;

export type NexusGenAbstractsUsingStrategyResolveType = never;

export type NexusGenFeaturesConfig = {
  abstractTypeStrategies: {
    __typename: true
    isTypeOf: false
    resolveType: false
  }
}

export interface NexusGenTypes {
  context: Context;
  inputTypes: NexusGenInputs;
  rootTypes: NexusGenRootTypes;
  inputTypeShapes: NexusGenInputs & NexusGenEnums & NexusGenScalars;
  argTypes: NexusGenArgTypes;
  fieldTypes: NexusGenFieldTypes;
  fieldTypeNames: NexusGenFieldTypeNames;
  allTypes: NexusGenAllTypes;
  typeInterfaces: NexusGenTypeInterfaces;
  objectNames: NexusGenObjectNames;
  inputNames: NexusGenInputNames;
  enumNames: NexusGenEnumNames;
  interfaceNames: NexusGenInterfaceNames;
  scalarNames: NexusGenScalarNames;
  unionNames: NexusGenUnionNames;
  allInputTypes: NexusGenTypes['inputNames'] | NexusGenTypes['enumNames'] | NexusGenTypes['scalarNames'];
  allOutputTypes: NexusGenTypes['objectNames'] | NexusGenTypes['enumNames'] | NexusGenTypes['unionNames'] | NexusGenTypes['interfaceNames'] | NexusGenTypes['scalarNames'];
  allNamedTypes: NexusGenTypes['allInputTypes'] | NexusGenTypes['allOutputTypes']
  abstractTypes: NexusGenTypes['interfaceNames'] | NexusGenTypes['unionNames'];
  abstractTypeMembers: NexusGenAbstractTypeMembers;
  objectsUsingAbstractStrategyIsTypeOf: NexusGenObjectsUsingAbstractStrategyIsTypeOf;
  abstractsUsingStrategyResolveType: NexusGenAbstractsUsingStrategyResolveType;
  features: NexusGenFeaturesConfig;
}


declare global {
  interface NexusGenPluginTypeConfig<TypeName extends string> {
  }
  interface NexusGenPluginFieldConfig<TypeName extends string, FieldName extends string> {
  }
  interface NexusGenPluginInputFieldConfig<TypeName extends string, FieldName extends string> {
  }
  interface NexusGenPluginSchemaConfig {
  }
  interface NexusGenPluginArgConfig {
  }
}