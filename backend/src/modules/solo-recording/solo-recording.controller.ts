import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SoloRecordingService } from './solo-recording.service';
import { CreateSoloRecordingDto } from './dto/create-solo-recording.dto';
import { UploadedFileType } from '../../common/types/uploaded-file.type';
import { Messages } from '../../common/constants/messages.constant';
import { Param, ParseIntPipe } from '@nestjs/common';

@ApiTags('SoloRecording')
@Controller('solo-recordings')
export class SoloRecordingController {
  constructor(private readonly soloRecordingService: SoloRecordingService) {}

  @Post('upload-video')
  @ApiOperation({ summary: 'Bước 1: Upload file video để lấy URL' })
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File video (mp4, webm...)',
        },
      },
      required: ['file'],
    },
  })
  async uploadVideo(@UploadedFile() file: UploadedFileType) {
    console.log('=== CONTROLLER upload-video CALLED ===');
    console.log('File from Multer:', {
      fieldname: file?.fieldname,
      originalname: file?.originalname,
      mimetype: file?.mimetype,
      size: file?.size,
      buffer: file?.buffer
        ? `Buffer length: ${file.buffer.length}`
        : 'no buffer',
    });
    const data = await this.soloRecordingService.uploadVideo(file);
    return {
      message: Messages.SOLO_RECORDING.UPLOAD_VIDEO_SUCCESS,
      data: data,
    };
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Lấy lịch sử bản ghi âm của người dùng' })
  async getByUser(@Param('userId', ParseIntPipe) userId: number) {
    const data = await this.soloRecordingService.findByUser(userId);

    return {
      message: Messages.SOLO_RECORDING.USER_RECORDINGS_FETCHED,

      data: data,
    };
  }

  @Patch(':id/video')
  @ApiOperation({ summary: 'Cập nhật ngầm URL Video sau khi upload xong' })
  async updateVideoUrl(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { videoUrl: string; publicId: string },
  ) {
    const data = await this.soloRecordingService.updateVideoUrl(
      id,
      body.videoUrl,
      body.publicId,
    );
    return {
      message: 'Đã cập nhật Video URL thành công',
      data: data,
    };
  }

  @Post('upload')
  @ApiOperation({
    summary: 'Bước 2: Gửi Transcript Text, lưu DB và phân tích AI ngay lập tức',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'number', example: 5 },
        duration: { type: 'number', example: 90 },
        question: { type: 'string', example: 'Tell me about yourself' },
        transcript: {
          type: 'string',
          example: 'Xin chào, tôi là lập trình viên...',
        },
      },
      required: ['userId', 'transcript'],
    },
  })
  async upload(@Body() dto: CreateSoloRecordingDto) {
    if (!dto.transcript) {
      throw new BadRequestException(
        'Không nhận được dữ liệu văn bản (Transcript rỗng)',
      );
    }

    const data = await this.soloRecordingService.uploadAudioAndAnalyze(dto);
    return {
      message: 'Lưu transcript và phân tích AI thành công',
      data: data,
    };
  }
}
