import { BadRequestException } from '@nestjs/common';
import { Writable } from 'stream';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryService } from './cloudinary.service';

jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

describe('CloudinaryService', () => {
  let service: CloudinaryService;
  const uploadStream = cloudinary.uploader.upload_stream as jest.Mock;
  const destroy = cloudinary.uploader.destroy as jest.Mock;
  const file = {
    fieldname: 'file',
    originalname: 'file.png',
    encoding: '7bit',
    mimetype: 'image/png',
    size: 3,
    buffer: Buffer.from('abc'),
  };

  beforeEach(() => {
    service = new CloudinaryService();
    uploadStream.mockReset();
    destroy.mockReset();
    uploadStream.mockImplementation((_options: any, callback: any) => {
      const writable = new Writable({
        write(_chunk, _encoding, done) {
          done();
        },
      });
      writable.on('finish', () =>
        callback(null, {
          secure_url: 'https://cdn.test/file',
          public_id: 'public/file',
        }),
      );
      return writable;
    });
  });

  it('uploads an avatar with image transformations', async () => {
    await expect(service.uploadAvatar(file)).resolves.toEqual(
      expect.objectContaining({ secure_url: 'https://cdn.test/file' }),
    );
    expect(uploadStream.mock.calls[0][0]).toEqual(
      expect.objectContaining({ folder: 'interview_dojo/avatars' }),
    );
  });

  it('rejects invalid avatar input', async () => {
    await expect(service.uploadAvatar(undefined as any)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      service.uploadAvatar({ ...file, mimetype: 'application/pdf' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('uploads valid video and audio content with correct resource options', async () => {
    await service.uploadVideo({ ...file, mimetype: 'video/webm' }, 'videos');
    expect(uploadStream.mock.calls[0][0]).toEqual(
      expect.objectContaining({ resource_type: 'video', folder: 'videos' }),
    );

    await service.uploadAudio({ ...file, mimetype: 'audio/wav' });
    expect(uploadStream.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        resource_type: 'auto',
        folder: 'interview_dojo/solo_recordings_audio',
      }),
    );
  });

  it('rejects invalid video and audio content', async () => {
    await expect(
      service.uploadVideo(undefined as any, 'videos'),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.uploadVideo({ ...file, mimetype: 'text/plain' }, 'videos'),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.uploadAudio(undefined as any)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      service.uploadAudio({ ...file, mimetype: 'text/plain' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.uploadAudio({ ...file, mimetype: '' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('propagates stream upload errors and delegates deletion', async () => {
    uploadStream.mockImplementationOnce((_options: any, callback: any) => {
      const writable = new Writable({
        write(_chunk, _encoding, done) {
          done();
        },
      });
      writable.on('finish', () => callback(new Error('failed')));
      return writable;
    });

    await expect(service.uploadAvatar(file)).rejects.toThrow('failed');

    destroy.mockResolvedValue({ result: 'ok' });
    await service.deleteFile('public/file', 'video');
    expect(destroy).toHaveBeenCalledWith('public/file', {
      resource_type: 'video',
    });
  });

  it('rejects an upload response without a result and uses image deletion by default', async () => {
    uploadStream.mockImplementationOnce((_options: any, callback: any) => {
      const writable = new Writable({
        write(_chunk, _encoding, done) {
          done();
        },
      });
      writable.on('finish', () => callback(null, undefined));
      return writable;
    });

    await expect(service.uploadAvatar(file)).rejects.toThrow(
      'Cloudinary returned no result',
    );

    destroy.mockResolvedValue({ result: 'ok' });
    await service.deleteFile('public/avatar');
    expect(destroy).toHaveBeenCalledWith('public/avatar', {
      resource_type: 'image',
    });
  });

  it('uses a fallback message when Cloudinary provides an empty error message', async () => {
    uploadStream.mockImplementationOnce((_options: any, callback: any) => {
      const writable = new Writable({
        write(_chunk, _encoding, done) {
          done();
        },
      });
      writable.on('finish', () => callback({ message: '' }));
      return writable;
    });

    await expect(service.uploadAvatar(file)).rejects.toThrow(
      'Cloudinary upload failed',
    );
  });
});
