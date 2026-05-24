import { useSessionStore } from '../stores/useSessionStore';
import { useSessionSocket } from '../hooks/useSessionSocket';
import { SessionFilters } from '../components/SessionFilters';
import { SessionList } from '../components/SessionList';
import { SessionTab } from '../types/session.types';
import { CancelSessionModal } from '../components/modals/CancelSessionModal';
import { RejectReasonModal } from '../components/modals/RejectReasonModal';
import { UserProfileModal } from '../components/modals/UserProfileModal';
import { ReceivedFeedbackModal } from '../components/modals/ReceivedFeedbackModal';
export default function SessionPage() {
  // Lắng nghe socket để auto-reload data (theo AC)
  useSessionSocket();

  const { filters, setFilters } = useSessionStore();
  const { feedbackModalData, closeFeedbackModal } = useSessionStore();

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
      <ReceivedFeedbackModal
        open={feedbackModalData.isOpen}
        onClose={closeFeedbackModal}
        sessionId={feedbackModalData.sessionId}
      />
    </div>
  );
}
