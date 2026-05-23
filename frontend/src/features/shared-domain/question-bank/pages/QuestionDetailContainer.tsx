import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Layout } from '@/shared/components/layout/Layout';
import { TheoryView } from '../components/QuestionDetail/TheoryView';
import { CodingView } from '../components/QuestionDetail/CodingView';
import { DetailSidebar } from '../components/QuestionDetail/DetailSidebar';
import { AnswerSection } from '../components/QuestionDetail/AnswerSection';
import { useQuestionDetail } from '../hooks/useQuestions';
import { QuestionType } from '../types/question.types';
import { BookmarkButton } from '@/features/bookmark/components/BookmarkButton';

export default function QuestionDetailContainer() {
  const { id } = useParams<{ id: string }>();
  const { data: question, isLoading, error } = useQuestionDetail(id!);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-indigo-600 w-8 h-8" />
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="text-center py-20 text-red-500">Question not found or failed to load.</div>
    );
  }

  // Sửa: dùng question.questionType thay vì question.type
  if (question.questionType === QuestionType.CODING) {
    return <CodingView question={question} />;
  }

  const parsedData = typeof question.data === 'string' ? JSON.parse(question.data) : question.data;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6 flex justify-between items-center">
          <Link
            to="/question-bank"
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Question Bank
          </Link>
          {/* Thêm fallback false cho isBookmarked */}
          <BookmarkButton questionId={question.id} isBookmarked={question.isBookmarked || false} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            <TheoryView question={question} parsedData={parsedData} />
            <AnswerSection answersCount={0} />
          </div>
          <div className="lg:col-span-4">
            <DetailSidebar question={question} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
