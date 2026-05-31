import { ApprovalStatus, SlotRecurrentType } from '@prisma/client';
import { CandidateFeature } from '../interfaces/candidate-feature.interface';
import { MentorFeature } from '../interfaces/mentor-feature.interface';
import { HardFilterService } from './hard-filter.service';

describe('HardFilterService', () => {
  const future = new Date(Date.now() + 60_000);
  const past = new Date(Date.now() - 60_000);

  const candidate: CandidateFeature = {
    id: 1,
    embedding: [],
    skills: [],
    languages: ['English'],
    experienceYears: 3,
    role: 'Backend Engineer',
    bookmarkedQuestions: [],
    bookingHistory: [],
  };

  const baseMentor: MentorFeature = {
    id: 2,
    embedding: [],
    skills: [],
    languages: ['English'],
    experienceYears: 3,
    bio: '',
    coachingPlans: [],
    approvalStatus: ApprovalStatus.ACTIVE,
    rawRoles: [],
    availableSlots: [
      {
        startTime: future,
        endTime: new Date(future.getTime() + 60_000),
        recurrentType: SlotRecurrentType.NONE,
        recurrentUntil: null,
        isActive: true,
      },
    ],
  };

  it('keeps mentors that pass approval, experience, language, and slot checks', () => {
    expect(new HardFilterService().filter(candidate, [baseMentor])).toEqual([
      baseMentor,
    ]);
  });

  it('allows any language when candidate has no language preference', () => {
    const noLanguageCandidate = { ...candidate, languages: [] };
    const mentor = { ...baseMentor, languages: ['Vietnamese'] };

    expect(
      new HardFilterService().filter(noLanguageCandidate, [mentor]),
    ).toEqual([mentor]);
  });

  it.each([
    [{ approvalStatus: ApprovalStatus.PENDING }, 'approval'],
    [{ experienceYears: 1 }, 'experience'],
    [{ languages: ['Japanese'] }, 'language'],
    [
      {
        availableSlots: [{ ...baseMentor.availableSlots[0], isActive: false }],
      },
      'inactive slot',
    ],
    [
      {
        availableSlots: [{ ...baseMentor.availableSlots[0], startTime: past }],
      },
      'past slot',
    ],
  ])('filters mentors that fail %s', (override, _reason) => {
    const mentor = { ...baseMentor, ...override } as MentorFeature;

    expect(new HardFilterService().filter(candidate, [mentor])).toEqual([]);
  });
});
