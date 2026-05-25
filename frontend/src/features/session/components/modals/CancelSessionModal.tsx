import { useState, useEffect } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useCancelSession } from '../../hooks/useSessionMutations';

export const CancelSessionModal = () => {
  const { cancelModalData, closeCancelModal, rejectModalData, closeRejectModal } =
    useSessionStore();

  const [reason, setReason] = useState('');
  const { mutate: cancelSession, isPending } = useCancelSession();

  // Tự động xoá trắng ô nhập lý do cũ khi đóng modal nhập
  useEffect(() => {
    if (!cancelModalData.isOpen) {
      setReason('');
    }
  }, [cancelModalData.isOpen]);

  // Nếu cả 2 trạng thái đóng/mở đều bằng false thì không vẽ gì ra màn hình
  if (!cancelModalData.isOpen && !rejectModalData.isOpen) return null;

  // TRƯỜNG HỢP 1: CHẾ ĐỘ XEM LÝ DO (READ-ONLY)
  if (rejectModalData.isOpen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl animate-in fade-in zoom-in-95">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Reason</h2>
            <button
              onClick={closeRejectModal}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              &times;
            </button>
          </div>

          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-6">
            <p className="text-gray-700 whitespace-pre-wrap">
              {rejectModalData.reason || 'No specific reason information available.'}
            </p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={closeRejectModal}
              className="px-6 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // TRƯỜNG HỢP 2: CHẾ ĐỘ NHẬP LÝ DO HUỶ

  const handleSubmit = () => {
    if (!reason.trim() || !cancelModalData.sessionId) return;

    cancelSession(
      { sessionId: cancelModalData.sessionId, reason },
      { onSuccess: () => closeCancelModal() }, // Đóng modal khi API thành công
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl animate-in fade-in zoom-in-95">
        <h2 className="text-xl font-bold mb-4">Cancel session</h2>
        <p className="text-sm text-gray-600 mb-4">
          Please provide the reason for cancelling this session. This action cannot be undone.
        </p>

        <textarea
          className="w-full px-3 py-2 border rounded-md outline-none focus:border-red-500 mb-4 h-24 resize-none text-sm"
          placeholder="Enter cancellation reason..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={isPending}
        />

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={closeCancelModal}
            className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            disabled={isPending}
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason.trim() || isPending}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {isPending ? 'Loading...' : 'Confirm Cancellation'}
          </button>
        </div>
      </div>
    </div>
  );
};
