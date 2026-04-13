import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CodeforcesService } from './codeforces.service';
import { CodeforcesController } from './codeforces.controller';

@Module({
  imports: [HttpModule],
  providers: [CodeforcesService],
  controllers: [CodeforcesController],
})
export class CodeforcesModule {}
