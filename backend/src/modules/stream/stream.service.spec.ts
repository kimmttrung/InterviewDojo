// src/modules/stream/stream.service.spec.ts
import { InternalServerErrorException } from '@nestjs/common';
import { StreamClient } from '@stream-io/node-sdk';
import { StreamService } from './stream.service';

// Mock uuid để tránh lỗi ESM
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234'),
}));

const generateUserToken = jest.fn();
const getOrCreate = jest.fn();
const call = { getOrCreate };
const videoCall = jest.fn(() => call);

jest.mock('@stream-io/node-sdk', () => ({
  StreamClient: jest.fn().mockImplementation(() => ({
    generateUserToken,
    video: { call: videoCall },
  })),
}));

describe('StreamService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STREAM_API_KEY = 'api';
    process.env.STREAM_SECRET_KEY = 'secret';
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('requires stream configuration', () => {
    delete process.env.STREAM_API_KEY;
    expect(() => new StreamService()).toThrow();
  });

  it('creates the SDK client and generates user tokens', () => {
    generateUserToken.mockReturnValue('token');
    const service = new StreamService();
    expect(StreamClient).toHaveBeenCalledWith('api', 'secret', {
      timeout: 10000,
    });
    expect(service.createToken('7')).toBe('token');
    expect(generateUserToken).toHaveBeenCalledWith({
      user_id: '7',
      validity_in_seconds: 3600,
    });
  });

  it('wraps token generation failure', () => {
    generateUserToken.mockImplementation(() => {
      throw new Error('token');
    });
    const service = new StreamService();
    expect(() => service.createToken('7')).toThrow(
      InternalServerErrorException,
    );
  });

  // Thêm test cho createCall
  it('creates video calls and wraps SDK failure', async () => {
    getOrCreate.mockResolvedValue(undefined);
    const service = new StreamService();
    await expect(service.createCall('room', '7')).resolves.toBe(call);
    expect(videoCall).toHaveBeenCalledWith('default', 'room');
    expect(getOrCreate).toHaveBeenCalledWith({
      data: { created_by_id: '7' },
    });

    getOrCreate.mockRejectedValueOnce(new Error('down'));
    await expect(service.createCall('room', '7')).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  // Test cho createMeetingRoom
  it('creates meeting room with custom data', async () => {
    getOrCreate.mockResolvedValue(undefined);
    const service = new StreamService();
    const result = await service.createMeetingRoom(123, 456, 789);
    expect(result).toEqual({
      roomId: 'mock-uuid-1234',
      meetingLink: '/meeting/mock-uuid-1234',
    });
    expect(videoCall).toHaveBeenCalledWith('default', 'mock-uuid-1234');
    expect(getOrCreate).toHaveBeenCalledWith({
      data: {
        created_by_id: '456',
        custom: { bookingId: 123, mentorId: 456, candidateId: 789 },
      },
    });
  });

  // Test cho getOrCreateMeetingLink
  it('gets or creates meeting link', async () => {
    getOrCreate.mockResolvedValue(undefined);
    const service = new StreamService();
    const link = await service.getOrCreateMeetingLink('room-xyz', '999');
    expect(link).toBe('/meeting/room-xyz');
    expect(videoCall).toHaveBeenCalledWith('default', 'room-xyz');
    expect(getOrCreate).toHaveBeenCalledWith({
      data: { created_by_id: '999' },
    });
  });
});
