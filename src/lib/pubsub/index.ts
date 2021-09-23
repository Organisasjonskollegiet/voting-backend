import { RedisPubSub } from 'graphql-redis-subscriptions';
import { PubSub } from 'graphql-subscriptions';
import Redis from 'ioredis';

const options: Redis.RedisOptions = {
    host: process.env.REDIS_HOST,
    port: 6380,
    retryStrategy: (times: number) => {
        // reconnect after
        return Math.min(times * 50, 2000);
    },
};

export const pubsub =
    process.env.NODE_ENV == 'production'
        ? new RedisPubSub({
              publisher: new Redis(options),
              subscriber: new Redis(options),
          })
        : new PubSub();
