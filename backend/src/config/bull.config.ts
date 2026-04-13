import { ConfigService } from '@nestjs/config';
import { BullRootModuleOptions } from '@nestjs/bullmq';

export const bullConfig = (config: ConfigService): BullRootModuleOptions => ({
    connection: {
        host: config.get<string>('REDIS_HOST', 'localhost'),
        port: config.get<number>('REDIS_PORT', 6379),
        password: config.get<string>('REDIS_PASSWORD'),
    },
    defaultJobOptions: {
        removeOnComplete: 500,
        removeOnFail: 100,
        attempts: 5,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
    },
});