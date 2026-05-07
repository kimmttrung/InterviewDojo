import { Module } from '@nestjs/common';
import { SoloRecordingController } from './solo-recording.controller';
import { SoloRecordingService } from './solo-recording.service';
import { SoloRecordingDatabaseService } from './solo-recording-database.service';
import { SoloRecordingExternalService } from './solo-recording-external.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { AiAnalysisModule } from '../ai-analysis/ai-analysis.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, CloudinaryModule, AiAnalysisModule],
  controllers: [SoloRecordingController],
  providers: [
    SoloRecordingService,
    SoloRecordingDatabaseService,
    SoloRecordingExternalService,
  ],
})
export class SoloRecordingModule {}
