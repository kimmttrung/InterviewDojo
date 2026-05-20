export interface QuestionItem {
  id: number;
  title: string;
  slug: string;
  difficulty: string;
  questionType: string;
  isPublished: boolean;
  createdAt: Date;
  description: string;
  categories: string[];
  companies: string[];
  jobRoles: string[];
}
