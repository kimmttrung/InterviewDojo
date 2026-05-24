import { InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { CodeEngineService } from './code-engine.service';

jest.mock('axios');

describe('CodeEngineService', () => {
  let service: CodeEngineService;
  const post = axios.post as jest.MockedFunction<typeof axios.post>;

  beforeEach(() => {
    service = new CodeEngineService();
    post.mockReset();
    process.env.JUDGE0_URL = 'https://judge.test/submissions';
    process.env.JUDGE0_KEY = 'key';
    process.env.JUDGE0_HOST = 'host';
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('executes source without stdin and decodes Judge0 fields', async () => {
    post.mockResolvedValue({
      data: {
        stdout: Buffer.from('ok\n').toString('base64'),
        stderr: '',
        compile_output: null,
        status: { description: 'Accepted' },
        time: '0.01',
        memory: 128,
      },
    } as any);

    const result = await service.executeCode('print("ok")', '71');

    expect(post).toHaveBeenCalledWith(
      'https://judge.test/submissions?base64_encoded=true&wait=true',
      {
        source_code: Buffer.from('print("ok")').toString('base64'),
        language_id: 71,
        stdin: '',
      },
      {
        headers: {
          'x-rapidapi-key': 'key',
          'x-rapidapi-host': 'host',
        },
      },
    );
    expect(result).toEqual({
      stdout: 'ok\n',
      stderr: '',
      compile_output: '',
      status: 'Accepted',
      time: '0.01',
      memory: 128,
    });
  });

  it('executes with stdin and returns fallback result fields', async () => {
    post.mockResolvedValue({ data: {} } as any);

    const result = await service.executeWithInput('code', 63, 'input');

    expect(post.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        stdin: Buffer.from('input').toString('base64'),
      }),
    );
    expect(result).toEqual({
      stdout: '',
      stderr: '',
      compile_output: '',
      status: 'Unknown',
      time: '0',
      memory: 0,
    });
  });

  it('executes through processor API with its default empty stdin', async () => {
    post.mockResolvedValue({ data: {} } as any);

    await service.executeWithInput('code', 63);

    expect(post.mock.calls[0][1]).toEqual(
      expect.objectContaining({ stdin: '' }),
    );
  });

  it('wraps Judge0 network failures', async () => {
    post.mockRejectedValue(new Error('down'));

    await expect(service.executeCode('code', '71')).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
