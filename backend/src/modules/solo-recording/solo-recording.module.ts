import { Module } from '@nestjs/common';
import { SoloRecordingController } from './solo-recording.controller';
import { SoloRecordingService } from './solo-recording.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { AiAnalysisModule } from '../ai-analysis/ai-analysis.module';

@Module({
  imports: [CloudinaryModule, AiAnalysisModule],
  controllers: [SoloRecordingController],
  providers: [SoloRecordingService],
})
export class SoloRecordingModule {}