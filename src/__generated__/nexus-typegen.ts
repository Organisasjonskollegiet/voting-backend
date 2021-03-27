/**
 * This file was generated by Nexus Schema
 * Do not make changes to this file directly
 */


import { Context } from "./../context"


declare global {
  interface NexusGenCustomOutputProperties<TypeName extends string> {
    model: NexusPrisma<TypeName, 'model'>
    crud: any
  }
}

declare global {
  interface NexusGen extends NexusGenTypes {}
}

export interface NexusGenInputs {
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
    startTime: string; // String!
    status: NexusGenEnums['Status']; // Status!
    title: string; // String!
  }
  Mutation: {};
  Participant: { // root type
    isVotingEligible: boolean; // Boolean!
    role: NexusGenEnums['Role']; // Role!
  }
  Query: {};
  User: { // root type
    email: string; // String!
    id: string; // ID!
    username: string; // String!
  }
  Votation: { // root type
    blankVotes?: boolean | null; // Boolean
    description: string; // String!
    hasVoted?: Array<NexusGenRootTypes['User'] | null> | null; // [User]
    id: string; // ID!
    majorityThreshold: number; // Int!
    majorityType: NexusGenEnums['MajorityType']; // MajorityType!
    meetingId: string; // String!
    order?: number | null; // Int
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
}

export type NexusGenRootTypes = NexusGenObjects

export type NexusGenAllTypes = NexusGenRootTypes & NexusGenScalars & NexusGenEnums

export interface NexusGenFieldTypes {
  Alternative: { // field return type
    id: string; // ID!
    text: string; // String!
    votation: NexusGenRootTypes['Votation'] | null; // Votation
    votationId: string; // String!
    votes: Array<NexusGenRootTypes['Vote'] | null> | null; // [Vote]
  }
  Meeting: { // field return type
    description: string | null; // String
    id: string; // ID!
    owner: NexusGenRootTypes['User']; // User!
    participants: Array<NexusGenRootTypes['Participant'] | null>; // [Participant]!
    startTime: string; // String!
    status: NexusGenEnums['Status']; // Status!
    title: string; // String!
    votations: Array<NexusGenRootTypes['Votation'] | null> | null; // [Votation]
  }
  Mutation: { // field return type
    addUser: NexusGenRootTypes['User'] | null; // User
    cast_vote: NexusGenRootTypes['Vote'] | null; // Vote
  }
  Participant: { // field return type
    isVotingEligible: boolean; // Boolean!
    meeting: NexusGenRootTypes['Meeting']; // Meeting!
    role: NexusGenEnums['Role']; // Role!
    user: NexusGenRootTypes['User']; // User!
  }
  Query: { // field return type
    alternatives_by_votation: Array<NexusGenRootTypes['Alternative'] | null> | null; // [Alternative]
    meetings_for_user: Array<NexusGenRootTypes['Meeting'] | null>; // [Meeting]!
    meetings_for_user_by_id: NexusGenRootTypes['Meeting']; // Meeting!
    user: NexusGenRootTypes['User']; // User!
    users: Array<NexusGenRootTypes['User'] | null>; // [User]!
    votations_by_meeting: Array<NexusGenRootTypes['Votation'] | null> | null; // [Votation]
  }
  User: { // field return type
    email: string; // String!
    id: string; // ID!
    username: string; // String!
  }
  Votation: { // field return type
    alternatives: Array<NexusGenRootTypes['Alternative'] | null> | null; // [Alternative]
    blankVotes: boolean | null; // Boolean
    description: string; // String!
    hasVoted: Array<NexusGenRootTypes['User'] | null> | null; // [User]
    id: string; // ID!
    majorityThreshold: number; // Int!
    majorityType: NexusGenEnums['MajorityType']; // MajorityType!
    meeting: NexusGenRootTypes['Meeting']; // Meeting!
    meetingId: string; // String!
    order: number | null; // Int
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
    votation: 'Votation'
    votationId: 'String'
    votes: 'Vote'
  }
  Meeting: { // field return type name
    description: 'String'
    id: 'ID'
    owner: 'User'
    participants: 'Participant'
    startTime: 'String'
    status: 'Status'
    title: 'String'
    votations: 'Votation'
  }
  Mutation: { // field return type name
    addUser: 'User'
    cast_vote: 'Vote'
  }
  Participant: { // field return type name
    isVotingEligible: 'Boolean'
    meeting: 'Meeting'
    role: 'Role'
    user: 'User'
  }
  Query: { // field return type name
    alternatives_by_votation: 'Alternative'
    meetings_for_user: 'Meeting'
    meetings_for_user_by_id: 'Meeting'
    user: 'User'
    users: 'User'
    votations_by_meeting: 'Votation'
  }
  User: { // field return type name
    email: 'String'
    id: 'ID'
    username: 'String'
  }
  Votation: { // field return type name
    alternatives: 'Alternative'
    blankVotes: 'Boolean'
    description: 'String'
    hasVoted: 'User'
    id: 'ID'
    majorityThreshold: 'Int'
    majorityType: 'MajorityType'
    meeting: 'Meeting'
    meetingId: 'String'
    order: 'Int'
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
    addUser: { // args
      email: string; // String!
      username: string; // String!
    }
    cast_vote: { // args
      alternativeId: string; // String!
      votationId: string; // String!
    }
  }
  Query: {
    alternatives_by_votation: { // args
      votationId: string; // String!
    }
    meetings_for_user_by_id: { // args
      id: string; // String!
    }
    user: { // args
      id: string; // String!
    }
    votations_by_meeting: { // args
      meetingId: string; // String!
    }
  }
}

export interface NexusGenAbstractTypeMembers {
}

export interface NexusGenTypeInterfaces {
}

export type NexusGenObjectNames = keyof NexusGenObjects;

export type NexusGenInputNames = never;

export type NexusGenEnumNames = keyof NexusGenEnums;

export type NexusGenInterfaceNames = never;

export type NexusGenScalarNames = keyof NexusGenScalars;

export type NexusGenUnionNames = never;

export type NexusGenObjectsUsingAbstractStrategyIsTypeOf = never;

export type NexusGenAbstractsUsingStrategyResolveType = never;

export type NexusGenFeaturesConfig = {
  abstractTypeStrategies: {
    isTypeOf: false
    resolveType: true
    __typename: false
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