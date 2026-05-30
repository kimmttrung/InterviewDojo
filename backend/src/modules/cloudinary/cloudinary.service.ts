import { Injectable, BadRequestException } from '@nestjs/common';
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiOptions,
} from 'cloudinary';
import { Readable } from 'stream';
import { UploadedFileType } from '../../common/types/uploaded-file.type';
import * as path from 'path';

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

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
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

      upload.end(buffer);
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

  async uploadImage(
    file: UploadedFileType,
    folder: string,
  ): Promise<UploadApiResponse> {
    if (!file?.buffer) throw new BadRequestException('Image file required');
    if (!this.isValidMimetype(file.mimetype, ALLOWED_IMAGE_TYPES)) {
      throw new BadRequestException(
        `Invalid image type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
      );
    }
    return this.uploadStream(file.buffer, {
      folder,
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    });
  }

  async uploadVideo(
    file: UploadedFileType,
    folder: string,
  ): Promise<UploadApiResponse> {
    if (!file?.buffer) {
      throw new BadRequestException('Video file is required');
    }

    if (!this.isValidMimetype(file.mimetype, ALLOWED_VIDEO_TYPES)) {
      throw new BadRequestException(
        `Invalid video type: ${file.mimetype}. Chỉ chấp nhận: ${ALLOWED_VIDEO_TYPES.join(', ')}`,
      );
    }

    return this.uploadStream(file.buffer, {
      resource_type: 'video',

      folder,

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

  async uploadRawFile(
    file: UploadedFileType,
    folder: string,
  ): Promise<UploadApiResponse> {
    if (!file?.buffer) {
      throw new BadRequestException('Document file is required');
    }

    if (!this.isValidMimetype(file.mimetype, ALLOWED_DOCUMENT_TYPES)) {
      throw new BadRequestException(
        `Invalid document type. Allowed formats: PDF, DOC, DOCX`,
      );
    }

    // 1. Trích xuất đuôi file gốc (Ví dụ: .pdf)
    const fileExt = path.extname(file.originalname).toLowerCase();

    // 2. Tạo tên ngẫu nhiên độc nhất
    const randomName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    // 3. ĐỊNH CẤU HÌNH CHIẾN THUẬT:
    // - Nếu là PDF: Ép sang 'image' để mở khóa quyền xem công khai (Public Access) trên Cloudinary
    // - Nếu là WORD (.doc, .docx): Bắt buộc giữ 'raw'
    const isPdf = fileExt === '.pdf';
    const targetResourceType = isPdf ? 'image' : 'raw';

    // Với file hình ảnh/PDF (đã ép sang 'image'), Cloudinary tự điền đuôi file vào URL nên không cần cộng fileExt vào public_id.
    // Với file raw (Word), bắt buộc phải cộng fileExt vào tên public_id để tránh mất định dạng.
    const customPublicId = isPdf ? randomName : `${randomName}${fileExt}`;

    return this.uploadStream(file.buffer, {
      folder,
      resource_type: targetResourceType as any, // Ép kiểu linh hoạt
      public_id: customPublicId,
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
