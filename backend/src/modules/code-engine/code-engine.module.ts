import { Module } from '@nestjs/common';
import { CodeEngineService } from './code-engine.service';
import { CodeEngineController } from './code-engine.controller';

@Module({
  controllers: [CodeEngineController],
  providers: [CodeEngineService],
  exports: [CodeEngineService],
})
export class CodeEngineModule {}
