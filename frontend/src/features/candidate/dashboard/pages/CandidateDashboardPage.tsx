'use client';

import { Layout } from '@/shared/components/layout/Layout';
import { Footer } from '@/shared/components/layout/Footer';

import { AnalyticsSection } from '../components/sections/AnalyticsSection';
import { AISummarySection } from '../components/sections/AISummarySection';
import { UpcomingSessionsSection } from '../components/sections/UpcomingSessionsSection';
import { InterestedCategoriesSection } from '../components/sections/InterestedCategoriesSection';

const CandidateDashboardPage = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Container giới hạn chiều rộng và thêm padding tương tự các trang khác */}
        <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          {/* Tiêu đề trang (Header text) */}
          <div className="mb-8 space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your interview practice progress and upcoming sessions.
            </p>
          </div>

          {/* Nội dung Dashboard của bạn */}
          <div className="space-y-6">
            <AnalyticsSection />

            <AISummarySection />

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 xl:col-span-8">
                <UpcomingSessionsSection />
              </div>

              <div className="col-span-12 xl:col-span-4">
                <InterestedCategoriesSection />
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </Layout>
  );
};

export default CandidateDashboardPage;
