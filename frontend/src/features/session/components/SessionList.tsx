import { useSessions } from '../hooks/useSessions';
import { useSessionStore } from '../stores/useSessionStore';
import { SessionCard } from './SessionCard';
import { SessionItem } from '../types/session.types'; // Bổ sung import type

export const SessionList = () => {
  const { data, isLoading, isError } = useSessions();
  const { setFilters } = useSessionStore(); // Đã xóa 'filters' chưa sử dụng

  if (isError) {
    return <div className="text-center text-red-500 py-10">Đã xảy ra lỗi khi tải danh sách.</div>;
  }

  // Skeleton UI khi đang loading
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-white p-4 rounded-lg border flex flex-col gap-3">
            <div className="flex justify-between">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="space-y-2">
                  <div className="w-32 h-4 bg-gray-200 rounded"></div>
                  <div className="w-20 h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="w-24 h-4 bg-gray-200 rounded"></div>
            </div>
            <div className="w-full h-12 bg-gray-100 rounded-md mt-2"></div>
          </div>
        ))}
      </div>
    );
  }

  const sessions = data?.items || [];
  const meta = data?.meta;

  // Empty State
  if (sessions.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-lg border border-dashed">
        <img
          src="/assets/empty-box.svg"
          alt="Empty"
          className="w-24 h-24 mx-auto mb-4 opacity-50"
        />
        <p className="text-gray-500 text-lg">Không có phiên học nào.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Render danh sách */}
      {sessions.map(
        (
          session: SessionItem, // Đã thêm type cho session
        ) => (
          <SessionCard key={session.id} session={session} />
        ),
      )}

      {/* Pagination (Phân trang) */}
      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            disabled={meta.page <= 1}
            onClick={() => setFilters({ page: meta.page - 1 })}
            className="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-50"
          >
            Trước
          </button>
          <span className="text-sm text-gray-600">
            Trang {meta.page} / {meta.totalPages}
          </span>
          <button
            disabled={meta.page >= meta.totalPages}
            onClick={() => setFilters({ page: meta.page + 1 })}
            className="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-50"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
};
