import { EmbeddingService } from './embedding.service';

describe('EmbeddingService', () => {
  let queue: { add: jest.Mock };
  let service: EmbeddingService;

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(123456);
    queue = { add: jest.fn().mockResolvedValue(undefined) };
    service = new EmbeddingService(queue as never);
    jest.spyOn((service as never)['logger'], 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('enqueues candidate embedding job', async () => {
    await service.enqueueCandidate(7, 50);

    expect(queue.add).toHaveBeenCalledWith(
      'process-candidate',
      { candidateId: 7 },
      {
        jobId: 'candidate-embedding-7-123456',
        delay: 50,
        removeOnComplete: true,
        removeOnFail: true,
        keepLogs: 5,
      },
    );
  });

  it('enqueues mentor embedding job', async () => {
    await service.enqueueMentor(9, 25);

    expect(queue.add).toHaveBeenCalledWith(
      'process-mentor',
      { mentorId: 9 },
      {
        jobId: 'mentor-embedding-9-123456',
        delay: 25,
        keepLogs: 5,
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
  });
});
