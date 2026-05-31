import { AvailibilityScoreService } from './availability-score.service';

describe('AvailibilityScoreService', () => {
  let service: AvailibilityScoreService;

  beforeEach(() => {
    service = new AvailibilityScoreService();
  });

  it('returns 0 when mentor has no slots', () => {
    expect(service.calculateAvailabilityScore([], [])).toBe(0);
  });

  it('returns neutral score when candidate has no history', () => {
    expect(
      service.calculateAvailabilityScore(
        [],
        [
          {
            startTime: new Date('2026-06-01T09:00:00Z'),
            endTime: new Date('2026-06-01T10:00:00Z'),
          },
        ],
      ),
    ).toBe(0.5);
  });

  it('scores matching slots by same day and overlapping time', () => {
    const candidateHistory = [
      {
        startTime: new Date('2026-06-01T09:00:00Z'),
        endTime: new Date('2026-06-01T10:00:00Z'),
      },
    ];
    const mentorSlots = [
      {
        startTime: new Date('2026-06-01T09:30:00Z'),
        endTime: new Date('2026-06-01T10:30:00Z'),
      },
      {
        startTime: new Date('2026-06-02T09:30:00Z'),
        endTime: new Date('2026-06-02T10:30:00Z'),
      },
    ];

    expect(
      service.calculateAvailabilityScore(candidateHistory, mentorSlots),
    ).toBe(0.5);
  });

  it('caps matched slot ratio at 1', () => {
    const candidateHistory = [
      {
        startTime: new Date('2026-06-01T09:00:00Z'),
        endTime: new Date('2026-06-01T12:00:00Z'),
      },
    ];
    const mentorSlots = [
      {
        startTime: new Date('2026-06-01T09:30:00Z'),
        endTime: new Date('2026-06-01T10:30:00Z'),
      },
    ];

    expect(
      service.calculateAvailabilityScore(candidateHistory, mentorSlots),
    ).toBe(1);
  });
});
