import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SoloRecordingService } from './solo-recording.service';
import { CreateSoloRecordingDto } from './dto/create-solo-recording.dto';

@Controller('solo-recordings')
export class SoloRecordingController {
  constructor(private readonly soloRecordingService: SoloRecordingService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateSoloRecordingDto,
  ) {
    return this.soloRecordingService.uploadAudio(file, dto);
  }

  @Get('user/:userId')
  async getByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.soloRecordingService.findByUser(userId);
  }
}
