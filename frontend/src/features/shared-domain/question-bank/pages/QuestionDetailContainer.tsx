import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Layout } from '../../../../shared/components/layout/Layout';
import { TheoryView } from '../components/QuestionDetail/TheoryView';
import { CodingView } from '../components/QuestionDetail/CodingView';
import { DetailSidebar } from '../components/QuestionDetail/DetailSidebar';
import { QuestionType } from '../types';
import { questionService } from '../services/question.service';
import { AnswerSection } from '../components/QuestionDetail/AnswerSection';

// Feature Components

export default function QuestionDetailContainer() {
  const { id } = useParams();
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await questionService.getById(id as string);
        setQuestion(res?.data?.data || res?.data);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetch();
  }, [id]);

  if (loading) return <LoadingScreen />;
  if (!question) return <NotFound />;

  // Phân loại render theo QuestionType Enum
  if (question.type === QuestionType.CODING) {
    return <CodingView question={question} />;
  }

  // Giao diện cho 3 loại Theory (TECHNICAL, BEHAVIORAL, SYSTEM_DESIGN)
  const parsedData = typeof question.data === 'string' ? JSON.parse(question.data) : question.data;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Back Button / Breadcrumb */}
        <div className="mb-6">
          <Link
            to="/question-bank"
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Question Bank
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            <TheoryView question={question} parsedData={parsedData} />

            {/* Tích hợp Answer Section */}
            <AnswerSection answersCount={question.answersCount} />
          </div>

          <div className="lg:col-span-4">
            <DetailSidebar question={question} />
          </div>
        </div>
      </div>
    </Layout>
  );
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="animate-spin text-indigo-600" />
    </div>
  );
}

function NotFound() {
  return <div className="text-center py-20">Question not found</div>;
}
