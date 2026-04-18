import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CodingService } from './coding.service';
import { CodingController } from './coding.controller';
import { CodeExecutionProcessor } from './processors/code-execution.processor';
import { CodeEngineService } from '../code-engine/code-engine.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { CodeEngineModule } from '../code-engine/code-engine.module';
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'code-execution',
    }),
    PrismaModule,
    CodeEngineModule,
  ],
  controllers: [CodingController],
  providers: [CodingService, CodeExecutionProcessor],
  exports: [CodingService],
})
export class CodingModule {}
