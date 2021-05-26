import { PubSub } from 'graphql-subscriptions';

export const pubsub = new PubSub(); // Dette er en pubsub i minne. I prod vil vi bruke Redisversjonen av pubsub
