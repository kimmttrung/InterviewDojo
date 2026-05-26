import { Injectable } from '@nestjs/common';

import { CandidateFeature } from '../interfaces/candidate-feature.interface';
import { MentorFeature } from '../interfaces/mentor-feature.interface';

@Injectable()
export class HardFilterService {
  filter(
    candidate: CandidateFeature,
    mentors: MentorFeature[],
  ): MentorFeature[] {
    const now = new Date();

    return mentors.filter((mentor) => {
      const approved = mentor.approvalStatus === 'ACTIVE';

      const enoughExperience =
        mentor.experienceYears >= Math.max(candidate.experienceYears - 1, 0);

      const languageMatched =
        candidate.languages.length === 0 ||
        mentor.languages.some((language) =>
          candidate.languages.includes(language),
        );

      const hasAvailableSlot = mentor.availableSlots.some(
        (slot) => slot.isActive && slot.startTime > now,
      );

      console.log(
        `Đánh giá Mentor ID ${mentor.id} - Approved: ${approved}, Enough Experience: ${enoughExperience}, Language Matched: ${languageMatched}, Has Available Slot: ${hasAvailableSlot}`,
      );

      return (
        approved && enoughExperience && languageMatched && hasAvailableSlot
      );
    });
  }
}
