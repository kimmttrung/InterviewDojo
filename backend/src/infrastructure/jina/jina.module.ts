import { Module } from '@nestjs/common';

import { JinaService } from './jina.service';

@Module({
  providers: [JinaService],

  exports: [JinaService],
})
export class JinaModule {}
