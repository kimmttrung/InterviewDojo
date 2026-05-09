export enum QuestionType {
  SYSTEM_DESIGN = 'SYSTEM_DESIGN',
  BEHAVIORAL = 'BEHAVIORAL',
  TECHNICAL = 'TECHNICAL',
  CODING = 'CODING',
}

export interface Question {
  id: number;
  title: string;
  createdAt?: string;
  difficulty?: string;
  questionType: QuestionType; // Map trực tiếp với Enum QuestionType
  answersCount?: number;
  description?: any;
  companies?: string[];
  slug?: string;
}

export interface PaginationMeta {
  total: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}
