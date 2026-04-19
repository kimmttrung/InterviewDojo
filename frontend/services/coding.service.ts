// src/services/coding.service.ts
import { api } from '../lib/api';
import { API_ENDPOINT } from '../lib/endpoints';

export interface SubmitCodeDto {
  codingQuestionId: number;
  languageId: string;
  sourceCode: string;
}

export interface CodeSubmission {
  id: number;
  userId: number;
  codingQuestionId: number;
  languageId: string;
  language: string;
  status: string;
  score?: number;
  passedTestCases?: number;
  totalTestCases?: number;
  executionTime?: number;
  memoryUsed?: number;
  errorMessage?: string;
  submittedAt: string;
  judgedAt?: string;
}

export const codingService = {
  // Lấy tất cả câu hỏi coding (đã public)
  getAllQuestions: async () => {
    const response = await api.get(API_ENDPOINT.CODING.GET_ALL);
    return response.data;
  },

  // Nộp bài coding (quan trọng nhất)
  submitCode: async (data: SubmitCodeDto): Promise<CodeSubmission> => {
    const response = await api.post(API_ENDPOINT.CODING.SUBMIT, data);
    return response.data.data || response.data;
  },

  // Lấy chi tiết submission theo ID
  getSubmissionById: async (id: number): Promise<CodeSubmission> => {
    const response = await api.get(API_ENDPOINT.CODING.GET_SUBMISSION(id));
    return response.data.data || response.data;
  },

  // Lấy chi tiết câu hỏi coding theo slug (nếu cần)
  getQuestionBySlug: async (slug: string) => {
    const response = await api.get(API_ENDPOINT.CODING.GET_QUESTION(slug));
    return response.data.data || response.data;
  },
};