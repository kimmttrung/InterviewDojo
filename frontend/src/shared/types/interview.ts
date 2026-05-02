// src/types/interview.ts
export type WorkMode = 'code' | 'theory' | 'whiteboard';

export interface TestCase {
  id: number;
  codingQuestionId: number;
  input: string;
  expectedOutput: string;
  isSample: boolean;
  isHidden: boolean;
  points: number;
  order: number;
  explanation: string | null;
}

export interface QuestionAPI {
  id: number;
  title: string;
  slug: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  tags: string[];
  constraints: string;
  hints: string[];
  timeLimit: number;
  memoryLimit: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  testCases: TestCase[];
}

export interface Question {
  id: number;
  title: string;
  content: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  examples: { input: string; output: string; explanation?: string }[];
  constraints?: string;
  hints?: string[];
  timeLimit?: number;
  memoryLimit?: number;
}

export interface TheoryQuestion {
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  content: string;
  examples: { input: string; output: string }[];
}
