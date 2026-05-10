import { Search, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { Input } from '@/shared/components/ui/input';
import { Layout } from '@/shared/components/layout/Layout';
import { QuestionCard } from '../components/QuestionCard';
import { QuestionFilters } from '../components/QuestionFilters';
import { QuestionPagination } from '../components/QuestionPagination';
import { useQuestions } from '../hooks/useQuestions';
import { useQuestionsFilters } from '@/stores/questionFilters.store';

export default function QuestionBank() {
  const { page, limit, keyword, difficulty, type, setPage, setKeyword } = useQuestionsFilters();
  const debouncedKeyword = useDebounce(keyword, 500);

  const { data, isLoading, error } = useQuestions({
    page,
    limit,
    keyword: debouncedKeyword,
    difficulty,
    type,
  });

  if (error) {
    return (
      <Layout>
        <div className="text-center py-20 text-red-500">
          Failed to load questions. Please try again.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6 bg-white min-h-screen">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold text-slate-900 leading-tight">Question Bank</h1>
            <p className="text-slate-500">Explore {data?.meta.total || 0} technical questions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <main className="lg:col-span-8 space-y-6">
            <QuestionFilters />
            {isLoading ? (
              <div className="flex flex-col items-center py-20">
                <Loader2 className="animate-spin text-indigo-600 w-8 h-8" />
              </div>
            ) : (
              <div className="space-y-6">
                {data?.items.map((q) => (
                  <QuestionCard key={q.id} question={q} />
                ))}
                <QuestionPagination />
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
