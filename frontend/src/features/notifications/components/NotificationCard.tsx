import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { Link } from 'lucide-react';
import type { NotificationItem } from '../types/notification.types';

dayjs.extend(relativeTime);
dayjs.locale('vi');

interface Props {
  item: NotificationItem;
  onClick: (item: NotificationItem) => void;
}

export const NotificationCard = ({ item, onClick }: Props) => {
  // Kiểm tra xem thông báo này có thuộc loại cuộc họp (Interview) hay không
  const isMeetingLink = item.type === 'INTERVIEW_UPCOMING' || item.type === 'INTERVIEW_STARTED';

  return (
    <div
      onClick={() => onClick(item)}
      className="group relative block w-full cursor-pointer border-b border-gray-50 bg-blue-50/40 p-4 text-left transition-colors last:border-0 hover:bg-blue-100/50"
    >
      <p className="text-sm font-semibold text-gray-900">{item.title}</p>

      <p className="mt-1 text-xs text-gray-600 line-clamp-2">{item.message}</p>

      {/* Đã xoá chữ "Phòng phỏng vấn: ", chỉ in ra mỗi URL */}
      {item.targetUrl && isMeetingLink && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-600">
          <Link className="h-3 w-3 shrink-0" />
          <span className="truncate group-hover:underline font-medium">{item.targetUrl}</span>
        </div>
      )}

      <p className="mt-2 text-[10px] text-gray-400">{dayjs(item.createdAt).fromNow()}</p>
    </div>
  );
};
