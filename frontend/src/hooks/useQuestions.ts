// src/hooks/useQuestions.ts
import { useState, useCallback } from 'react';
import { questionService } from '../features/shared-domain/question-bank/services/question.service';
import { QuestionType } from '../features/shared-domain/question-bank/types';

export function useQuestions() {
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Cập nhật: Thêm tham số difficulty vào logic lấy câu hỏi ngẫu nhiên
  const getRandomQuestion = useCallback(async (type?: QuestionType, difficulty?: string) => {
    setIsLoading(true);
    try {
      const params = {
        page: 1,
        limit: 50, // Lấy tập đủ lớn để việc random có ý nghĩa
        questionType: type, // Đảm bảo dùng đúng key Backend mong đợi (questionType)
        difficulty: difficulty,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      console.log('🎲 Requesting random question with filters:', { type, difficulty });

      const res = await questionService.getAll(params);
      const list = res?.data?.data || [];

      if (list.length > 0) {
        // Thực hiện random trong danh sách trả về
        const selected = list[Math.floor(Math.random() * list.length)];

        // Fetch chi tiết để lấy đầy đủ data (testcases, theory data, constraints...)
        const detailRes = await questionService.getById(selected.id);
        const fullData = detailRes?.data?.data || detailRes?.data;

        setCurrentQuestion(fullData);
        console.log('🎲 Question:', fullData);
        return fullData;
      }

      // Nếu không tìm thấy câu nào phù hợp với filter
      setCurrentQuestion(null);
      console.log('🎲 Question:', null);

      return null;
    } catch (error) {
      console.error('Random question failed:', error);
      setCurrentQuestion(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    currentQuestion,
    setCurrentQuestion,
    getRandomQuestion,
    isLoading,
  };
}
