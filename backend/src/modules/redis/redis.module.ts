import { Module, Global, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        return new Redis(process.env.REDIS_URL as string, {
          tls: {},
          maxRetriesPerRequest: null,
        });
      },
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule implements OnModuleDestroy {
  onModuleDestroy() {
    // optional: đóng connection nếu muốn
  }
}
