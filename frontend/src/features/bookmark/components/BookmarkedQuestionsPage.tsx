// features/bookmarks/pages/BookmarkedQuestionsPage.tsx
import { useState, useEffect } from 'react';
import { useBookmarks, useUnbookmark } from '../hooks/useBookmarks';
import { useBookmarkStore } from '../stores/useBookmarkStore';
import { useDebounce } from '@/hooks/use-debounce';
import { Difficulty } from '@/features/shared-domain/question-bank/types/question.types';
import dayjs from 'dayjs';

export const BookmarkedQuestionsPage = () => {
  const { filters, setFilters, resetFilters } = useBookmarkStore();
  const { data, isLoading, isError } = useBookmarks();
  const { mutate: unbookmark } = useUnbookmark();

  const [searchTerm, setSearchTerm] = useState(filters.search);
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilters({ search: debouncedSearch });
    }
  }, [debouncedSearch, filters.search, setFilters]);

  if (isError) {
    return <div className="text-center text-red-500 py-10">Error loading list</div>;
  }

  const questions = data?.items || [];
  const meta = data?.meta;

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">Bookmarked Questions</h1>

      {/* Filters (excluding category) */}
      <div className="bg-white p-4 rounded-lg border shadow-sm mb-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search by title..."
            className="flex-1 min-w-[200px] px-4 py-2 border rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="px-4 py-2 border rounded-md"
            value={filters.difficulty || ''}
            onChange={(e) => setFilters({ difficulty: e.target.value || undefined })}
          >
            <option value="">All difficulties</option>
            <option value={Difficulty.EASY}>Easy</option>
            <option value={Difficulty.MEDIUM}>Medium</option>
            <option value={Difficulty.HARD}>Hard</option>
          </select>
          <input
            type="date"
            className="px-4 py-2 border rounded-md"
            value={filters.startDate || ''}
            onChange={(e) => setFilters({ startDate: e.target.value || undefined })}
            placeholder="From date"
          />
          <input
            type="date"
            className="px-4 py-2 border rounded-md"
            value={filters.endDate || ''}
            onChange={(e) => setFilters({ endDate: e.target.value || undefined })}
            placeholder="To date"
          />
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-red-600 border border-red-600 rounded-md hover:bg-red-50"
          >
            Clear filters
          </button>
        </div>
      </div>

      {/* Bookmarked questions list */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white h-32 rounded-lg" />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-dashed">
          <p className="text-gray-500">No questions bookmarked yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {questions.map((q) => (
            <div key={q.id} className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{q.title}</h3>
                  <div className="flex gap-2 mt-1">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        q.difficulty === 'EASY'
                          ? 'bg-green-100 text-green-700'
                          : q.difficulty === 'MEDIUM'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {q.difficulty}
                    </span>
                    {q.categories?.map((c) => (
                      <span key={c.id} className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  Saved at: {dayjs(q.bookmarkedAt).format('HH:mm DD/MM/YYYY')}
                </div>
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  onClick={() => unbookmark(q.id)}
                  className="px-4 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50"
                >
                  Unbookmark
                </button>
                <a
                  href={`/questions/${q.slug}`}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                >
                  View details
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center gap-4 mt-6">
          <button
            disabled={meta.page <= 1}
            onClick={() => setFilters({ page: meta.page - 1 })}
            className="px-4 py-2 border rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {meta.page} / {meta.totalPages}
          </span>
          <button
            disabled={meta.page >= meta.totalPages}
            onClick={() => setFilters({ page: meta.page + 1 })}
            className="px-4 py-2 border rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
