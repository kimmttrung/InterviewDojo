import { useEffect, useState } from 'react';
import { useSessionStore } from '../stores/useSessionStore';
import { useDebounce } from '@/hooks/use-debounce';

interface SessionFiltersProps {
  type?: string;
}

const statusOptions: Record<string, { value: string; label: string }[]> = {
  MENTOR_BOOKING: [
    { value: 'SCHEDULED', label: 'UPCOMING' },
    { value: 'ONGOING', label: 'ONGOING' },
    { value: 'COMPLETED', label: 'COMPLETED' },
    { value: 'CANCELLED', label: 'CANCELLED' },
  ],
  P2P_MATCH: [
    { value: 'ONGOING', label: 'ONGOING' },
    { value: 'COMPLETED', label: 'COMPLETED' },
  ],
  SOLO: [{ value: 'COMPLETED', label: 'COMPLETED' }],
};

export const SessionFilters = ({ type }: SessionFiltersProps) => {
  const { filters, setFilters } = useSessionStore();

  // Local state cho search input để kết hợp với debounce
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const activeType = type || filters.type;

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
          placeholder="Search mentor, candidate, plan..."
          className="w-full px-4 py-2 border rounded-md outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {activeType && statusOptions[activeType] && statusOptions[activeType].length > 1 && (
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 font-medium whitespace-nowrap">Status:</label>
          <select
            className="px-3 py-2 border rounded-md outline-none focus:border-primary"
            value={filters.statuses || ''}
            onChange={(e) => setFilters({ statuses: e.target.value || undefined })}
          >
            <option value="">All</option>
            {statusOptions[activeType].map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Lọc theo ngày bắt đầu */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600 font-medium">From:</label>
        <input
          type="date"
          className="px-3 py-2 border rounded-md outline-none focus:border-primary"
          value={filters.startDate || ''}
          onChange={(e) => setFilters({ startDate: e.target.value || null })}
        />
      </div>

      {/* Lọc theo ngày kết thúc */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600 font-medium">To:</label>
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
          Delete filters
        </button>
      )}
    </div>
  );
};
