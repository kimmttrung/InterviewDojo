import { useSessionStore } from '../stores/useSessionStore';
import { useSessionSocket } from '../hooks/useSessionSocket';
import { SessionFilters } from './SessionFilters';
import { SessionList } from './SessionList';
import { SessionTab } from '../types/session.types';
import { CancelSessionModal } from './modals/CancelSessionModal';
import { RejectReasonModal } from './modals/RejectReasonModal';
import { UserProfileModal } from '@/features/shared-domain/users/components/UserProfileModal';

export default function SessionPage() {
  // Lắng nghe socket để auto-reload data (theo AC)
  useSessionSocket();

  const { filters, setFilters } = useSessionStore();

  const TABS = Object.values(SessionTab);

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">Lịch sử & Phiên học</h1>

      {/* Tab Navigation */}
      <div className="flex gap-4 border-b">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`pb-2 px-4 ${filters.tab === tab ? 'border-b-2 border-primary font-bold' : 'text-gray-500'}`}
            onClick={() => setFilters({ tab })}
          >
            {tab}
          </button>
        ))}
      </div>

      <SessionFilters />
      <SessionList />
      <CancelSessionModal />
      <RejectReasonModal />
      <UserProfileModal />
    </div>
  );
}
