import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateSoloRecordingDto } from './dto/create-solo-recording.dto';

@Injectable()
export class SoloRecordingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async uploadAudio(file: Express.Multer.File, dto: CreateSoloRecordingDto) {
    if (!file) {
      throw new BadRequestException('File audio là bắt buộc');
    }

    const uploaded = await this.cloudinaryService.uploadAudio(file);

    return this.prisma.soloRecording.create({
      data: {
        userId: dto.userId,
        videoUrl: uploaded.secure_url, // tạm giữ field cũ nếu chưa muốn migrate DB
        publicId: uploaded.public_id,
        duration: dto.duration,
      },
    });
  }

  async findByUser(userId: number) {
    return this.prisma.soloRecording.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}