import { InternalServerErrorException } from '@nestjs/common';
import { StreamClient } from '@stream-io/node-sdk';
import { StreamService } from './stream.service';

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
});
