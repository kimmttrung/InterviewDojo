import { useSessionsByType } from '../hooks/useSessionByType';
import { useSessionStore } from '../stores/useSessionStore';
import { SessionCard } from './SessionCard';
import { SessionItem } from '../types/session.types';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { UserProfileModal } from '../components/modals/UserProfileModal';

export const SessionListByType = ({ type }: { type: string }) => {
  // Lấy filters.status từ global store thay vì dùng useState
  const { filters, setFilters } = useSessionStore();
  const { data, isLoading, isError } = useSessionsByType(type, filters.statuses);

  if (isError) {
    return <div className="text-center text-red-500 py-10">Failed to load sessions</div>;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-4 rounded-lg border">
            {/* ... (Giữ nguyên Skeleton) */}
            <div className="flex justify-between">
              <div className="flex gap-3">
                <Skeleton circle width={40} height={40} />
                <div>
                  <Skeleton width={120} height={20} />
                  <Skeleton width={80} height={16} style={{ marginTop: 4 }} />
                </div>
              </div>
              <Skeleton width={100} height={20} />
            </div>
            <Skeleton height={60} style={{ marginTop: 12 }} />
            <div className="flex justify-end gap-2 mt-3">
              <Skeleton width={80} height={36} />
              <Skeleton width={80} height={36} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const sessions = data?.items || [];
  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-4">
      {sessions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-dashed">
          <img
            src="/assets/empty-box.svg"
            alt="Empty"
            className="w-24 h-24 mx-auto mb-4 opacity-50"
          />
          <p className="text-gray-500 text-lg">No sessions available.</p>
        </div>
      ) : (
        <>
          {sessions.map((session: SessionItem) => (
            <SessionCard key={session.id} session={session} />
          ))}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <button
                disabled={meta.page <= 1}
                onClick={() => setFilters({ page: meta.page - 1 })}
                className="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {meta.page} / {meta.totalPages}
              </span>
              <button
                disabled={meta.page >= meta.totalPages}
                onClick={() => setFilters({ page: meta.page + 1 })}
                className="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
      <UserProfileModal />
    </div>
  );
};
