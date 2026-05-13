// features/candidate/list-mentor/pages/MentorListPage.tsx
import { useState } from 'react';
import { useMentors } from '../hooks/useMentors';
import { MentorCard } from '@/features/candidate/list-mentor/conponents/MentorCard';
import { MentorFilters } from '@/features/candidate/list-mentor/conponents/MentorFilters';
import { Layout } from '@/shared/components/layout/Layout';
import { Button } from '@/shared/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function MentorListPage() {
  const [filters, setFilters] = useState({ page: 1, limit: 10 });
  const { data, isLoading } = useMentors(filters);
  const mentors = data?.items || [];
  const meta = data?.meta;

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Find Your Mentor</h1>

        <MentorFilters filters={filters} setFilters={setFilters} />

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {mentors.map((mentor: any) => (
                <MentorCard key={mentor.id} mentor={mentor} />
              ))}
            </div>

            {meta && (
              <div className="flex justify-between items-center mt-8">
                <Button
                  disabled={filters.page <= 1}
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                >
                  Previous
                </Button>
                <span>
                  Page {meta.page} of {meta.totalPages}
                </span>
                <Button
                  disabled={filters.page >= meta.totalPages}
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
