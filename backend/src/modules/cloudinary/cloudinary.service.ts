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
  'application/octet-stream',
];

const ALLOWED_AUDIO_TYPES = [
  'audio/webm',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aac',
  'audio/ogg',
  'application/octet-stream',
];

@Injectable()
export class CloudinaryService {
  private uploadStream(
    buffer: Buffer,
    options: UploadApiOptions,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) {
            return reject(
              new Error(error.message || 'Cloudinary upload failed'),
            );
          }
          if (!result) {
            return reject(new Error('Cloudinary returned no result'));
          }
          resolve(result);
        },
      );

      Readable.from(buffer).pipe(upload);
    });
  }

  private isValidMimetype(mimetype: string, allowedTypes: string[]): boolean {
    if (!mimetype) return false;
    const lowerMime = mimetype.toLowerCase();
    return allowedTypes.some((type) =>
      lowerMime.startsWith(type.toLowerCase()),
    );
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

  // async uploadVideo(file: UploadedFileType): Promise<UploadApiResponse> {
  //   if (!file?.buffer) {
  //     throw new BadRequestException('Video file is required');
  //   }

  //   // // Kiểm tra mimetype
  //   // if (!ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
  //   //   throw new BadRequestException(
  //   //     `Invalid video type. Allowed: ${ALLOWED_VIDEO_TYPES.join(', ')}`,
  //   //   );
  //   // }
  //   const isValid = ALLOWED_VIDEO_TYPES.some((prefix) =>
  //     file.mimetype?.toLowerCase().startsWith(prefix.toLowerCase()),
  //   );

  //   if (!isValid) {
  //     throw new BadRequestException(
  //       `Định dạng không hợp lệ: ${file.mimetype}. Chỉ chấp nhận: ${ALLOWED_VIDEO_TYPES.join(', ')}`,
  //     );
  //   }

  //   return this.uploadStream(file.buffer, {
  //     resource_type: 'video', // Bắt buộc là video để hỗ trợ .mp4, .webm
  //     folder: 'interview_dojo/solo_recordings', // Đổi folder cho đồng bộ
  //     chunk_size: 6_000_000,
  //   });
  // }

  // async uploadAudio(file: UploadedFileType): Promise<UploadApiResponse> {
  //   if (!file?.buffer) {
  //     throw new BadRequestException('Audio file is required');
  //   }

  //   // if (!ALLOWED_AUDIO_TYPES.includes(file.mimetype)) {
  //   //   throw new BadRequestException(
  //   //     `Invalid audio type. Allowed: ${ALLOWED_AUDIO_TYPES.join(', ')}`,
  //   //   );
  //   // }
  //   const isValid = ALLOWED_AUDIO_TYPES.some((prefix) =>
  //     file.mimetype?.toLowerCase().startsWith(prefix.toLowerCase()),
  //   );

  //   if (!isValid) {
  //     throw new BadRequestException(
  //       `Định dạng không hợp lệ: ${file.mimetype}. Chỉ chấp nhận: ${ALLOWED_AUDIO_TYPES.join(', ')}`,
  //     );
  //   }

  //   return this.uploadStream(file.buffer, {
  //     resource_type: 'video',
  //     folder: 'interview_dojo/solo_recordings_audio',
  //     chunk_size: 6_000_000,
  //   });
  // }

  async uploadVideo(file: UploadedFileType): Promise<UploadApiResponse> {
    if (!file?.buffer) {
      throw new BadRequestException('Video file is required');
    }

    // Sửa: Sử dụng helper và mảng ALLOWED_VIDEO_TYPES
    if (!this.isValidMimetype(file.mimetype, ALLOWED_VIDEO_TYPES)) {
      throw new BadRequestException(
        `Invalid video type: ${file.mimetype}. Chỉ chấp nhận: ${ALLOWED_VIDEO_TYPES.join(', ')}`,
      );
    }

    return this.uploadStream(file.buffer, {
      resource_type: 'video',
      folder: 'interview_dojo/solo_recordings_video',
      chunk_size: 6_000_000,
    });
  }

  async uploadAudio(file: UploadedFileType): Promise<UploadApiResponse> {
    if (!file?.buffer) {
      throw new BadRequestException('Audio file is required');
    }

    // Sửa: Sử dụng helper và mảng ALLOWED_AUDIO_TYPES
    if (!this.isValidMimetype(file.mimetype, ALLOWED_AUDIO_TYPES)) {
      throw new BadRequestException(
        `Invalid audio type: ${file.mimetype}. Chỉ chấp nhận: ${ALLOWED_AUDIO_TYPES.join(', ')}`,
      );
    }

    return this.uploadStream(file.buffer, {
      // Sửa: Chuyển thành 'auto' để Cloudinary tự nhận diện file WAV/WebM tốt hơn
      resource_type: 'auto',
      folder: 'interview_dojo/solo_recordings_audio',
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
