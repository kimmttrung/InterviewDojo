export enum QuestionType {
  TECHNICAL = 'TECHNICAL',
  SYSTEM_DESIGN = 'SYSTEM_DESIGN',
  BEHAVIORAL = 'BEHAVIORAL',
  CODING = 'CODING',
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}
export interface GetQuestionsParams {
  page?: number;
  limit?: number;
  keyword?: string;
  difficulty?: Difficulty;
  type?: QuestionType;
  category?: string;
  jobRole?: string;
}

export interface RandomQuestionParams {
  difficulty?: Difficulty;
  type?: QuestionType;
  category?: string;
  jobRole?: string;
}

// Response data structures
export interface Question {
  id: number;
  title: string;
  slug: string;
  difficulty: Difficulty;
  questionType: QuestionType;
  isPublished: boolean;
  createdAt: string;
  description: string;
  categories: string[];
  companies: string[];
  jobRoles: string[];
  answersCount?: number; // optional, có thể tính sau
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse {
  items: Question[];
  meta: PaginationMeta;
}

export interface TestCase {
  id: number;
  input: string;
  output: string;
  order: number;
  isHidden: boolean;
}

export interface QuestionDetail extends Question {
  updatedAt: string;
  isCodingQuestion: boolean;
  // Theory
  data?: any;
  // Coding
  constraints?: string | null;
  timeLimit?: number;
  memoryLimit?: number;
  codeforcesLink?: string | null;
  testCases?: TestCase[];
  hints?: string[];
  tags?: string[];
}
