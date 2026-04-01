import { Module } from '@nestjs/common';
import { SoloRecordingController } from './solo-recording.controller';
import { SoloRecordingService } from './solo-recording.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  controllers: [SoloRecordingController],
  providers: [SoloRecordingService],
})
export class SoloRecordingModule {}
