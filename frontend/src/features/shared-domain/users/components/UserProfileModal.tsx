// src/features/users/components/UserProfileModal.tsx
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useRef, useState } from 'react';
import { useUserProfileModalStore } from '../stores/userProfileModalStore';

import { useReportUser } from '@/features/reports/hooks/useReportUser';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useUserProfile } from '../hooks/useUserProfile';

const REPORT_TYPES = [
  { value: 'HARASSMENT', label: 'Quấy rối' },
  { value: 'SCAM', label: 'Lừa đảo' },
  { value: 'FAKE_PROFILE', label: 'Hồ sơ giả' },
  { value: 'NO_SHOW', label: 'Không tham gia' },
  { value: 'CHEATING', label: 'Gian lận' },
  { value: 'PAYMENT_OUTSIDE', label: 'Thanh toán ngoài hệ thống' },
];

export const UserProfileModal = () => {
  const { isOpen, userId, closeModal } = useUserProfileModalStore();
  const { data: user, isLoading } = useUserProfile(userId);
  const { mutateAsync: reportUserAsync, isPending: isReporting } = useReportUser();

  const [showReportForm, setShowReportForm] = useState(false);
  const [reportType, setReportType] = useState('');
  const [reason, setReason] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form khi modal mở lại hoặc userId thay đổi
  useEffect(() => {
    if (isOpen) {
      setShowReportForm(false);
      setReportType('');
      setReason('');
      setEvidenceFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [isOpen, userId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Giới hạn 5 file, dung lượng tuỳ backend (vd 10MB/video, 5MB/ảnh)
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ];
    const validFiles = files.filter((f) => allowedTypes.includes(f.type));
    if (validFiles.length !== files.length) {
      alert('Chỉ chấp nhận file ảnh (jpeg, png, webp) và video (mp4, webm, mov)');
    }
    setEvidenceFiles(validFiles.slice(0, 5));
  };

  const removeFile = (index: number) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReport = async () => {
    if (!userId || !reportType || !reason.trim()) return;

    const formData = new FormData();
    formData.append('targetType', 'USER');
    formData.append('type', reportType);
    formData.append('reason', reason.trim());
    formData.append('targetUserId', userId.toString());
    if (evidenceFiles.length) {
      evidenceFiles.forEach((file) => formData.append('evidenceFiles', file));
    }

    try {
      await reportUserAsync(formData); // chờ API trả về
      // Chỉ đóng modal và reset sau khi thành công
      setShowReportForm(false);
      closeModal();
    } catch (error) {
      // lỗi đã được toast trong hook, không cần xử lý thêm
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div className="flex justify-between items-center">
                  <Dialog.Title className="text-lg font-semibold">
                    Thông tin người dùng
                  </Dialog.Title>
                  <button onClick={closeModal}>
                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                {isLoading ? (
                  <div className="py-8 text-center">Đang tải...</div>
                ) : user ? (
                  <div className="mt-4 space-y-3">
                    {/* Avatar + tên */}
                    <div className="flex items-center gap-4">
                      <img
                        src={user.avatarUrl || '/default-avatar.png'}
                        alt={user.name || 'User'}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                      <div>
                        <h3 className="font-medium">{user.name || 'Chưa có tên'}</h3>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>

                    {/* Role & Level */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Vai trò:</span> {user.role}
                      </div>
                      <div>
                        <span className="text-gray-500">Cấp độ:</span> {user.currentLevel}
                      </div>
                      <div>
                        <span className="text-gray-500">Kinh nghiệm:</span> {user.experienceYears}{' '}
                        năm
                      </div>
                    </div>

                    {/* Bio */}
                    {user.bio && (
                      <div>
                        <p className="text-sm text-gray-500">Giới thiệu:</p>
                        <p className="text-sm">{user.bio}</p>
                      </div>
                    )}

                    {user?.skills && user.skills.length > 0 && (
                      <div>
                        <p className="text-sm font-medium">Kỹ năng:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {user.skills.map((skill) => (
                            <span
                              key={skill.skillId}
                              className="bg-gray-100 rounded px-2 py-0.5 text-xs"
                            >
                              {skill.name} ({skill.level})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Social links */}
                    <div className="flex gap-3 text-sm">
                      {user.linkedInLink && (
                        <a
                          href={user.linkedInLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600"
                        >
                          LinkedIn
                        </a>
                      )}
                      {user.githubLink && (
                        <a
                          href={user.githubLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-gray-800"
                        >
                          GitHub
                        </a>
                      )}
                    </div>

                    {/* Nút Report */}
                    {!showReportForm ? (
                      <button
                        onClick={() => setShowReportForm(true)}
                        className="mt-3 w-full rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                      >
                        Báo cáo người dùng này
                      </button>
                    ) : (
                      <div className="mt-3 space-y-3 border-t pt-3">
                        <select
                          value={reportType}
                          onChange={(e) => setReportType(e.target.value)}
                          className="w-full rounded-lg border p-2 text-sm"
                        >
                          <option value="">Chọn lý do báo cáo</option>
                          {REPORT_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                        <textarea
                          placeholder="Mô tả chi tiết..."
                          rows={3}
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          className="w-full rounded-lg border p-2 text-sm"
                        />
                        <div className="space-y-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*,video/*"
                            onChange={handleFileChange}
                            className="w-full text-sm"
                          />
                          {evidenceFiles.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {evidenceFiles.map((file, idx) => (
                                <div key={idx} className="relative">
                                  {file.type.startsWith('image/') ? (
                                    <img
                                      src={URL.createObjectURL(file)}
                                      className="h-16 w-16 object-cover rounded"
                                      alt="preview"
                                    />
                                  ) : (
                                    <video
                                      src={URL.createObjectURL(file)}
                                      className="h-16 w-16 object-cover rounded"
                                      controls={false}
                                    />
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => removeFile(idx)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSubmitReport}
                            disabled={!reportType || !reason.trim() || isReporting}
                            className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                          >
                            {isReporting ? 'Đang gửi...' : 'Gửi báo cáo'}
                          </button>
                          <button
                            onClick={() => setShowReportForm(false)}
                            className="rounded-lg border px-4 py-2 text-sm"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center text-red-500">Không tìm thấy người dùng</div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
