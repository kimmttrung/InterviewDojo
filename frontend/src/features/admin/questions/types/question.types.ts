// src/features/admin/questions/types/question.types.ts
import {
  Difficulty,
  QuestionType,
} from '@/features/shared-domain/question-bank/types/question.types';

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Company {
  id: number;
  name: string;
  logoUrl?: string;
  industry?: string;
}

export interface JobRole {
  id: number;
  name: string;
  description?: string;
}

export interface TheoryQuestionData {
  question: string;
  tips: string[];
  followUps: string[];
  keyPoints: string[];
}

export interface TestCase {
  id?: number;
  input: string;
  expectedOutput: string;
  isSample: boolean;
  isHidden: boolean;
  points: number;
  order: number;
  explanation?: string;
}

export interface CodingQuestionData {
  description: string;
  constraints?: string;
  hints: string[];
  tags: string[];
  timeLimit: number;
  memoryLimit: number;
  codeforcesLink?: string;
  testCases: TestCase[];
}

export type CreateQuestionPayload =
  | {
      title: string;
      slug: string;
      difficulty: Difficulty;
      type: Exclude<QuestionType, 'CODING'>;
      isPublished: boolean;
      categoryIds: number[];
      companyIds: number[];
      jobRoleIds: number[];
      theoryData: TheoryQuestionData;
    }
  | {
      title: string;
      slug: string;
      difficulty: Difficulty;
      type: 'CODING';
      isPublished: boolean;
      categoryIds: number[];
      companyIds: number[];
      jobRoleIds: number[];
      codingData: CodingQuestionData;
    };
