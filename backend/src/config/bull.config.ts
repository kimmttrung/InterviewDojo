import { ConfigService } from '@nestjs/config';
import { BullRootModuleOptions } from '@nestjs/bullmq';
import Redis from 'ioredis';

export const bullConfig = (config: ConfigService): BullRootModuleOptions => {
  const redisUrl = config.get<string>('REDIS_URL');
  if (!redisUrl) throw new Error('REDIS_URL missing');

  const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    keepAlive: 10000,
    connectTimeout: 30000,
    enableReadyCheck: false,
    tls: {
      rejectUnauthorized: false,
    },
    retryStrategy: (times) => {
      console.log(`🔁 Redis retry attempt ${times}`);
      if (times > 5) {
        console.error('❌ Redis connection failed after 5 attempts');
        return null; // dừng retry, throw lỗi
      }
      return Math.min(times * 100, 3000);
    },
  });

  connection.on('connect', () => console.log('✅ Redis connected'));
  connection.on('error', (err) => console.error('Redis error:', err.message));

  return {
    connection,
    defaultJobOptions: {
      removeOnComplete: true,
      removeOnFail: 100,
    },
  };
};
