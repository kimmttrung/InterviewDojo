// src/hooks/useQuestions.ts
import { useState, useCallback, useEffect } from 'react';
import { Question, QuestionAPI, TheoryQuestion } from '../types/interview';
import { api } from '../../lib/api';
import { codingService } from '../../services/coding.service';

const THEORY_QUESTIONS: TheoryQuestion[] = [
  {
    title: 'Giải thích React Virtual DOM',
    difficulty: 'Medium',
    tags: ['React'],
    content:
      'Giải thích cơ chế hoạt động của React Virtual DOM. Tại sao nó lại giúp cải thiện hiệu năng so với DOM thực?',
    examples: [],
  },
  {
    title: 'Difference between let, const, and var',
    difficulty: 'Easy',
    tags: ['JavaScript'],
    content:
      'So sánh sự khác nhau giữa let, const và var trong JavaScript về scope, hoisting, và khả năng reassign.',
    examples: [],
  },
  {
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

  const fetchQuestions = useCallback(async () => {
    try {
      const response = await codingService.getAllQuestions();   // ← sửa dòng này
      const questions = response.data || response;
      console.log('check questions', questions);
      setCodingQuestions(questions);
    } catch (error) {
      console.error('Lỗi tải danh sách câu hỏi:', error);
    }
  }, []);

  const transformCodeQuestion = useCallback((selected: QuestionAPI): Question => {
    // Lấy các test case mẫu (isSample = true)
    const sampleTestCases =
      selected.testCases
        ?.filter((tc) => tc.isSample)
        .map((tc) => ({
          input: tc.input.trim(),
          output: tc.expectedOutput.trim(),
          explanation: tc.explanation || undefined,
        })) || [];

    // Format difficulty
    const difficultyMap = {
      EASY: 'Easy',
      MEDIUM: 'Medium',
      HARD: 'Hard',
    };

    return {
      id: selected.id,
      title: selected.title,
      difficulty: difficultyMap[selected.difficulty] || 'Medium',
      tags: selected.tags,
      content: selected.description,
      examples: sampleTestCases,
      constraints: selected.constraints,
      hints: selected.hints,
      timeLimit: selected.timeLimit,
      memoryLimit: selected.memoryLimit,
    };
  }, []);

  const getRandomQuestion = useCallback(
    (type: 'code' | 'theory') => {
      setIsLoading(true);

      if (type === 'code') {
        if (codingQuestions.length === 0) {
          setIsLoading(false);
          return null;
        }
        const selected = codingQuestions[Math.floor(Math.random() * codingQuestions.length)];
        const question = transformCodeQuestion(selected);
        setIsLoading(false);
        return question;
      } else {
        const random = THEORY_QUESTIONS[Math.floor(Math.random() * THEORY_QUESTIONS.length)];
        const theoryQuestion: Question = {
          id: Date.now(), // temporary id
          title: random.title,
          difficulty: random.difficulty,
          tags: random.tags,
          content: random.content,
          examples: random.examples,
        };
        setIsLoading(false);
        return theoryQuestion;
      }
    },
    [codingQuestions, transformCodeQuestion],
  );

  // Tự động fetch questions khi hook được gọi
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
