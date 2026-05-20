import { QuestionType } from '@prisma/client';

export interface QuestionDetail {
  id: number;
  title: string;
  slug: string;
  difficulty: string;
  type: QuestionType;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  categories: string[];
  companies: string[];
  jobRoles: string[];
  // Theory specific
  data?: any;
  // Coding specific
  description?: string;
  constraints?: string | null;
  timeLimit?: number;
  memoryLimit?: number;
  codeforcesLink?: string | null;
  testCases?: Array<{
    id: number;
    input: string;
    output: string;
    order: number;
    isHidden: boolean;
  }>;
  isCodingQuestion: boolean;
  hints?: string[];
  tags?: string[];
}
