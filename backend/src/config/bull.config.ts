// import { ConfigService } from '@nestjs/config';
// import { BullRootModuleOptions } from '@nestjs/bullmq';
// import Redis from 'ioredis';

// export const bullConfig = (config: ConfigService): BullRootModuleOptions => {
//   const redisUrl = config.get<string>('REDIS_URL');

//   if (!redisUrl) {
//     throw new Error('REDIS_URL is not defined');
//   }

//   return {
//     connection: new Redis(redisUrl, {
//       //tls: {},
//       maxRetriesPerRequest: null,
//     }),
//     defaultJobOptions: {
//       removeOnComplete: 500,
//       removeOnFail: 100,
//       attempts: 5,
//       backoff: {
//         type: 'exponential',
//         delay: 2000,
//       },
//     },
//   };
// };

import { ConfigService } from '@nestjs/config';
import { BullRootModuleOptions } from '@nestjs/bullmq';
import Redis from 'ioredis';

export const bullConfig = (config: ConfigService): BullRootModuleOptions => {
  const redisUrl = config.get<string>('REDIS_URL');
  if (!redisUrl) throw new Error('REDIS_URL missing');

  const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
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
      /* ... */
    },
  };
};
