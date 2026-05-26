import { BaseFeature } from './base-feature.interface';

export interface CandidateFeature extends BaseFeature {
  role: string;

  bookmarkedQuestions: string[];

  bookingHistory: string[];
}
