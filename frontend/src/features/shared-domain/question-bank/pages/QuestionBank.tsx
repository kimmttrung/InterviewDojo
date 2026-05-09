import { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';

// Feature components & types
import { PaginationMeta, Question, QuestionType } from '../types';
import { QuestionFilters } from '../components/QuestionFilters';
import { useDebounce } from '../../../../hooks/use-debounce';
import { Input } from '../../../../shared/components/ui/input';
import { questionService } from '../services/question.service';
import { Layout } from '../../../../shared/components/layout/Layout';
import { QuestionCard } from '../components/QuestionCard';
import { QuestionPagination } from '../components/QuestionPagination';

export default function QuestionBank() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [difficulty, setDifficulty] = useState<string | undefined>();
  const [type, setType] = useState<QuestionType | undefined>();

  const debouncedKeyword = useDebounce(keyword, 500);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        keyword: debouncedKeyword,
        difficulty,
        questionType: type, // Gửi trực tiếp QuestionType enum lên server
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      const res = await questionService.getAll(params);
      setQuestions(res?.data?.data || []);
      setMeta(res?.data?.meta || null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [debouncedKeyword, difficulty, type]);
  useEffect(() => {
    fetchQuestions();
  }, [page, debouncedKeyword, difficulty, type]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6 bg-white min-h-screen">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold text-slate-900 leading-tight">Question Bank</h1>
            <p className="text-slate-500">Explore {meta?.total || 0} technical questions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <main className="lg:col-span-8 space-y-6">
            <QuestionFilters
              currentType={type}
              difficulty={difficulty}
              onTypeChange={setType}
              onDifficultyChange={setDifficulty}
            />

            {loading ? (
              <div className="flex flex-col items-center py-20">
                <Loader2 className="animate-spin text-indigo-600" />
              </div>
            ) : (
              <div className="space-y-6">
                {questions.map((q) => (
                  <QuestionCard key={q.id} question={q} />
                ))}
                <QuestionPagination meta={meta} currentPage={page} onPageChange={setPage} />
              </div>
            )}
          </main>

          <aside className="lg:col-span-4 sticky top-24">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search keywords..."
                className="pl-10 h-12 bg-slate-50 border-none"
              />
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
