// src/shared/components/ApprovalGuard.tsx
import React from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
// Chú ý sửa lại đường dẫn này cho khớp với file chứa Enum ApprovalStatus của bạn
import { ApprovalStatus } from '../../types/enum';

interface ApprovalGuardProps {
  status: ApprovalStatus;
  children: React.ReactNode;
}

export default function ApprovalGuard({ status, children }: ApprovalGuardProps) {
  const isApproved = status === ApprovalStatus.APPROVED;

  return (
    <div className="relative min-h-[400px]">
      {/* 1. Lớp Overlay cảnh báo hiển thị trên cùng nếu chưa được Approved */}
      {!isApproved && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[2px] transition-all duration-500">
          <div className="bg-white p-8 rounded-2xl shadow-2xl border flex flex-col items-center text-center max-w-sm animate-in fade-in zoom-in duration-300">
            {status === ApprovalStatus.PENDING ? (
              <>
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                  <Lock className="text-yellow-600 w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Hồ sơ đang chờ duyệt</h3>
                <p className="text-gray-600">
                  Tính năng đặt lịch và quản lý slot sẽ khả dụng ngay khi Admin phê duyệt hồ sơ của
                  bạn.
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="text-red-600 w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Hồ sơ bị từ chối</h3>
                <p className="text-gray-600">
                  Rất tiếc, hồ sơ Mentor của bạn chưa đạt yêu cầu. Vui lòng cập nhật lại thông tin
                  hoặc liên hệ hỗ trợ.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* 2. Nội dung chính sẽ bị làm mờ và khóa tương tác */}
      <div
        className={cn(
          'transition-all duration-500',
          !isApproved && 'blur-md pointer-events-none select-none grayscale-[50%]',
        )}
      >
        {children}
      </div>
    </div>
  );
}
