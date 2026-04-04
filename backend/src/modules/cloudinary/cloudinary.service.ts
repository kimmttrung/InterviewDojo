import { Injectable, BadRequestException } from '@nestjs/common';
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiOptions,
} from 'cloudinary';
import { Readable } from 'stream';
import { UploadedFileType } from '../../common/types/uploaded-file.type';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

const ALLOWED_AUDIO_TYPES = [
  'audio/webm',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aac',
  'audio/ogg',
];

@Injectable()
export class CloudinaryService {
  private uploadStream(
    buffer: Buffer,
    options: UploadApiOptions,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error) {
          return reject(new Error(error.message || 'Cloudinary upload failed'));
        }
        if (!result) {
          return reject(new Error('Cloudinary returned no result'));
        }
        resolve(result);
      });

      Readable.from(buffer).pipe(upload);
    });
  }

  async uploadAvatar(file: UploadedFileType): Promise<UploadApiResponse> {
    if (!file?.buffer) {
      throw new BadRequestException('Avatar file is required');
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid image type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
      );
    }

    return this.uploadStream(file.buffer, {
      folder: 'interview_dojo/avatars',
      transformation: [
        { width: 250, height: 250, crop: 'thumb', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });
  }

  async uploadVideo(file: UploadedFileType): Promise<UploadApiResponse> {
    if (!file?.buffer) {
      throw new BadRequestException('Video file is required');
    }

    if (!ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid video type. Allowed: ${ALLOWED_VIDEO_TYPES.join(', ')}`,
      );
    }

    return this.uploadStream(file.buffer, {
      resource_type: 'video',
      folder: 'interview_dojo/mock_sessions',
      chunk_size: 6_000_000,
    });
  }

  async uploadAudio(file: UploadedFileType): Promise<UploadApiResponse> {
    if (!file?.buffer) {
      throw new BadRequestException('Audio file is required');
    }

    if (!ALLOWED_AUDIO_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid audio type. Allowed: ${ALLOWED_AUDIO_TYPES.join(', ')}`,
      );
    }

    return this.uploadStream(file.buffer, {
      resource_type: 'video',
      folder: 'interview_dojo/solo_recordings',
      chunk_size: 6_000_000,
    });
  }

  async deleteFile(
    publicId: string,
    resourceType: 'image' | 'video' = 'image',
  ) {
    return cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  }
}