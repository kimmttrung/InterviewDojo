// features/candidate/list-mentor/pages/MentorListPage.tsx
import { useState } from 'react';
import { useMentors } from '../hooks/useMentors';
import { MentorCard } from '@/features/candidate/list-mentor/components/MentorCard';
import { MentorFilters } from '@/features/candidate/list-mentor/components/MentorFilters';
import { Layout } from '@/shared/components/layout/Layout';
import { Button } from '@/shared/components/ui/button';
import { Loader2 } from 'lucide-react';
import { RecommendedMentors } from '../components/RecommendedMentors';

export default function MentorListPage() {
  const [filters, setFilters] = useState({ page: 1, limit: 9 });
  const { data, isLoading } = useMentors(filters);
  const mentors = data?.items || [];
  const meta = data?.meta;

  return (
    <Layout>
      {/* Khối bọc ngoài cùng có nền xám rất nhẹ để tôn dáng các Card trắng */}
      <div className="min-h-screen bg-slate-50/50">
        <div className="container mx-auto p-6 space-y-10">
          {/* Header Trang */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Find Your Mentor</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Connect with experts to accelerate your career growth.
            </p>
          </div>

          {/* SECTION 1: RECOMMENDATIONS (Được bọc trong card nền trắng tách biệt hẳn) */}
          <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <RecommendedMentors />
          </section>

          {/* ĐƯỜNG PHÂN CÁCH TINH TẾ */}
          <hr className="border-slate-200/80" />

          {/* SECTION 2: MAIN EXPLORE & SEARCH */}
          <section className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Explore All Mentors</h2>
                <p className="text-sm text-muted-foreground">
                  Use filters to find the perfect match for your needs.
                </p>
              </div>
            </div>

            {/* Bộ lọc Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <MentorFilters filters={filters} setFilters={setFilters} />
            </div>

            {/* Danh sách Mentors chính */}
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {mentors.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                    {mentors.map((mentor: any) => (
                      <MentorCard key={mentor.id} mentor={mentor} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
                    <p className="text-slate-500 font-medium">
                      No mentors found matching your criteria.
                    </p>
                  </div>
                )}

                {/* Pagination (Phân trang) */}
                {meta && meta.totalPages > 1 && (
                  <div className="flex justify-between items-center mt-10 pt-4 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={filters.page <= 1}
                      onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    >
                      Previous
                    </Button>
                    <span className="text-sm font-medium text-slate-600">
                      Page <span className="text-slate-900 font-semibold">{meta.page}</span> of{' '}
                      {meta.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={filters.page >= meta.totalPages}
                      onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
}
