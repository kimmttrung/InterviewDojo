import { useEffect, useState } from 'react';
import { useSessionStore } from '../stores/useSessionStore';
import { useDebounce } from '@/hooks/use-debounce'; // Import từ base folder của bạn

export const SessionFilters = () => {
  const { filters, setFilters } = useSessionStore();

  // Local state cho search input để kết hợp với debounce
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const debouncedSearch = useDebounce(searchTerm, 500); // Đợi 500ms sau khi ngừng gõ

  // Cập nhật store khi debounced value thay đổi
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilters({ search: debouncedSearch });
    }
  }, [debouncedSearch, setFilters, filters.search]);

  return (
    <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-lg border shadow-sm mb-4">
      {/* Search Input */}
      <div className="flex-1 min-w-[200px]">
        <input
          type="text"
          placeholder="Tìm kiếm mentor, candidate, plan..."
          className="w-full px-4 py-2 border rounded-md outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Lọc theo ngày bắt đầu */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600 font-medium">Từ:</label>
        <input
          type="date"
          className="px-3 py-2 border rounded-md outline-none focus:border-primary"
          value={filters.startDate || ''}
          onChange={(e) => setFilters({ startDate: e.target.value || null })}
        />
      </div>

      {/* Lọc theo ngày kết thúc */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600 font-medium">Đến:</label>
        <input
          type="date"
          className="px-3 py-2 border rounded-md outline-none focus:border-primary"
          value={filters.endDate || ''}
          onChange={(e) => setFilters({ endDate: e.target.value || null })}
        />
      </div>

      {/* Nút xoá bộ lọc */}
      {(filters.startDate || filters.endDate || filters.search) && (
        <button
          onClick={() => {
            setSearchTerm('');
            setFilters({ search: '', startDate: null, endDate: null });
          }}
          className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          Xoá bộ lọc
        </button>
      )}
    </div>
  );
};
