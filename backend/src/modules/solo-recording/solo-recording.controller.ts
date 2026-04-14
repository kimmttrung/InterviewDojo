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
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { SoloRecordingService } from './solo-recording.service';
import { CreateSoloRecordingDto } from './dto/create-solo-recording.dto';
import { UploadedFileType } from '../../common/types/uploaded-file.type';

@ApiTags('SoloRecording')
@Controller('solo-recordings')
export class SoloRecordingController {
  constructor(private readonly soloRecordingService: SoloRecordingService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        userId: { type: 'number', example: 5 },
        duration: { type: 'number', example: 90 },
        question: {
          type: 'string',
          example: 'Tell me about yourself',
        },
      },
      required: ['file', 'userId'],
    },
  })
  async upload(
    @UploadedFile() file: UploadedFileType,
    @Body() dto: CreateSoloRecordingDto,
  ) {
    return this.soloRecordingService.uploadAndAnalyze(file, dto);
  }

  @Get('user/:userId')
  async getByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.soloRecordingService.findByUser(userId);
  }
}
