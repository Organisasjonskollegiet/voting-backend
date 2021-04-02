import { GraphQLDateTime } from 'graphql-iso-date';
import { asNexusMethod } from 'nexus';
export const GQLDateTime = asNexusMethod(GraphQLDateTime, 'datetime');
