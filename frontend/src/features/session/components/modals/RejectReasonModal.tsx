import { useSessionStore } from '../../stores/useSessionStore';

export const RejectReasonModal = () => {
  // Giả định bạn đã thêm rejectModalData vào useSessionStore
  const { rejectModalData, closeRejectModal } = useSessionStore();

  if (!rejectModalData.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-red-600">Lý do từ chối</h2>
          <button onClick={closeRejectModal} className="text-gray-400 hover:text-gray-600">
            &times; {/* Dấu X đóng modal */}
          </button>
        </div>

        <div className="bg-red-50 p-4 rounded-md border border-red-100 mb-6">
          <p className="text-gray-700 whitespace-pre-wrap">
            {rejectModalData.reason || 'Mentor không để lại lý do cụ thể.'}
          </p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={closeRejectModal}
            className="px-6 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
