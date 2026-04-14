import { ConfigService } from '@nestjs/config';
import { BullRootModuleOptions } from '@nestjs/bullmq';
import Redis from 'ioredis';

export const bullConfig = (
  config: ConfigService,
): BullRootModuleOptions => {
  const redisUrl = config.get<string>('REDIS_URL');

  if (!redisUrl) {
    throw new Error('REDIS_URL is not defined');
  }

  return {
    connection: new Redis(redisUrl, {
      tls: {},
      maxRetriesPerRequest: null,
    }),
    defaultJobOptions: {
      removeOnComplete: 500,
      removeOnFail: 100,
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    },
  };
};