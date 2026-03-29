import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';

// file nay test thoi, tu import service mà su dung
@ApiTags('Dịch vụ Cloudinary')
@Controller('cloudinary')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('upload-avatar')
  @ApiOperation({
    summary: 'Upload Ảnh đại diện (Tự động tối ưu)',
    description:
      'Ảnh sẽ được tự động crop vuông và zoom vào mặt, giảm dung lượng.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Chọn file ảnh đại diện',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn một file ảnh!');
    }
    return this.cloudinaryService.uploadAvatar(file);
  }

  @Post('upload-video')
  @ApiOperation({ summary: 'Upload Video phỏng vấn (Dữ liệu gốc)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Chọn file video (mp4, webm...)',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn một file video!');
    }
    return this.cloudinaryService.uploadVideo(file);
  }
}
