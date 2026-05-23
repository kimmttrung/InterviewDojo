import { useState } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useCancelSession } from '../../hooks/useSessionMutations';

export const CancelSessionModal = () => {
  const { cancelModalData, closeCancelModal } = useSessionStore();
  const [reason, setReason] = useState('');

  const { mutate: cancelSession, isPending } = useCancelSession();

  if (!cancelModalData.isOpen) return null;

  const handleSubmit = () => {
    if (!reason.trim() || !cancelModalData.sessionId) return;

    cancelSession(
      { sessionId: cancelModalData.sessionId, reason },
      { onSuccess: () => closeCancelModal() }, // Đóng modal khi api thành công
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl animate-in fade-in zoom-in-95">
        <h2 className="text-xl font-bold mb-4">Huỷ phiên học</h2>
        <p className="text-sm text-gray-600 mb-4">
          Vui lòng cho biết lý do bạn muốn huỷ phiên học này. Hành động này không thể hoàn tác.
        </p>

        <textarea
          className="w-full px-3 py-2 border rounded-md outline-none focus:border-red-500 mb-4 h-24 resize-none"
          placeholder="Nhập lý do huỷ..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={closeCancelModal}
            className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md"
            disabled={isPending}
          >
            Quay lại
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason.trim() || isPending}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isPending ? 'Đang xử lý...' : 'Xác nhận huỷ'}
          </button>
        </div>
      </div>
    </div>
  );
};
