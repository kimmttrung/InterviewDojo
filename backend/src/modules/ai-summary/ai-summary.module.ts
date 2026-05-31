import { Module } from '@nestjs/common';

import { AiService } from './ai-summary.service';

@Module({
  providers: [AiService],

  exports: [AiService],
})
export class AiModule {}
