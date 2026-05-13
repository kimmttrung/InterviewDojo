import { BookingItem } from './booking-list.interface';

export interface BookingDetail extends BookingItem {
  candidateBio: string | null;
  candidateSkills: Array<{ name: string; level: string }>;
  coachingPlanDescription: string | null;
  answers: Array<{
    question: string;
    answerText: string | null;
    fileUrl: string | null;
  }>;
  // messageFromCandidate đã được kế thừa từ BookingItem
}
