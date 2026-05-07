// src/hooks/useQuestions.ts
import { useState, useCallback, useEffect } from 'react';
import { Question, QuestionAPI } from '../shared/types/interview';
import { codingService } from '../features/shared-domain/code-editor/services/coding.service';

const THEORY_QUESTIONS: Question[] = [
  {
    id: 1,
    title: 'Giải thích React Virtual DOM',
    difficulty: 'Medium',
    tags: ['React'],
    content:
      'Giải thích cơ chế hoạt động của React Virtual DOM. Tại sao nó lại giúp cải thiện hiệu năng so với DOM thực?',
    examples: [],
  },
  {
    id: 2,
    title: 'Difference between let, const, and var',
    difficulty: 'Easy',
    tags: ['JavaScript'],
    content:
      'So sánh sự khác nhau giữa let, const và var trong JavaScript về scope, hoisting, và khả năng reassign.',
    examples: [],
  },
  {
    id: 3,
    title: 'Explain Closure in JavaScript',
    difficulty: 'Medium',
    tags: ['JavaScript'],
    content:
      'Closure là gì? Hãy giải thích cơ chế hoạt động và ứng dụng thực tế của closure trong JavaScript.',
    examples: [],
  },
];

export function useQuestions() {
  const [codingQuestions, setCodingQuestions] = useState<QuestionAPI[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ================= FETCH =================
  const fetchQuestions = useCallback(async () => {
    try {
      const response = await codingService.getAllQuestions();
      setCodingQuestions(response.data);
    } catch (error) {
      console.error('Lỗi tải danh sách câu hỏi:', error);
    }
  }, []);

  // ================= TRANSFORM =================
  const transformCodeQuestion = useCallback((selected: any): Question => {
    // ✅ FIX: Lấy object codingQuestion con từ data API trả về
    const details = selected.codingQuestion;

    const sampleTestCases =
      details?.testCases
        ?.filter((tc: any) => tc.isSample)
        .map((tc: any) => ({
          input: tc.input.trim(),
          output: tc.expectedOutput.trim(),
          explanation: tc.explanation || undefined,
        })) || [];

    const difficultyMap: Record<string, 'Easy' | 'Medium' | 'Hard'> = {
      EASY: 'Easy',
      MEDIUM: 'Medium',
      HARD: 'Hard',
    };

    return {
      id: selected.id,
      title: selected.title,
      difficulty: difficultyMap[selected.difficulty],
      // ✅ FIX: trỏ vào details (tức là selected.codingQuestion)
      tags: details?.tags || [],
      content: details?.description || '',
      examples: sampleTestCases,

      codingQuestion: {
        // ✅ FIX: trỏ vào details
        constraints: details?.constraints || '',
        hints: details?.hints || [],
        timeLimit: details?.timeLimit || 2000,
        memoryLimit: details?.memoryLimit || 256000,
      },
    };
  }, []);

  // ================= RANDOM =================
  const getRandomQuestion = useCallback(
    (type: 'code' | 'theory') => {
      setIsLoading(true);

      if (type === 'code') {
        if (codingQuestions.length === 0) {
          setIsLoading(false);
          return null;
        }
        console.log('Danh sách câu hỏi coding:', codingQuestions);
        const selected = codingQuestions[Math.floor(Math.random() * codingQuestions.length)];

        const question = transformCodeQuestion(selected);
        // setCurrentQuestion(question);
        setIsLoading(false);
        return question;
      }

      // THEORY
      const random = THEORY_QUESTIONS[Math.floor(Math.random() * THEORY_QUESTIONS.length)];

      setIsLoading(false);
      return {
        ...random,
        id: Date.now(), // tránh trùng id
      };
    },
    [codingQuestions, transformCodeQuestion],
  );

  // ================= INIT =================
  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  return {
    codingQuestions,
    currentQuestion,
    isLoading,
    setCurrentQuestion,
    fetchQuestions,
    getRandomQuestion,
    setIsLoading,
  };
}
