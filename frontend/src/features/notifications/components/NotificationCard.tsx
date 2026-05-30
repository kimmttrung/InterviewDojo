import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { Pin } from 'lucide-react';
import type { NotificationItem } from '../types/notification.types';

dayjs.extend(relativeTime);
dayjs.locale('vi');

interface Props {
  item: NotificationItem;
  onClick: (item: NotificationItem) => void;
  onTogglePin: (item: NotificationItem, e: React.MouseEvent) => void;
}

export const NotificationCard = ({ item, onClick, onTogglePin }: Props) => {
  const bgClass = item.isPinned
    ? 'bg-amber-50/50 hover:bg-amber-100/50'
    : item.isRead
      ? 'bg-white hover:bg-gray-50'
      : 'bg-blue-50/40 hover:bg-blue-100/50';

  return (
    <div
      onClick={() => onClick(item)}
      className={`group relative block w-full cursor-pointer border-b border-gray-50 p-4 text-left transition-colors last:border-0 ${bgClass}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={`text-sm ${item.isRead ? 'font-medium text-gray-700' : 'font-semibold text-gray-900'}`}
        >
          {item.title}
        </p>

        {/* Nút Ghim */}
        <button
          type="button"
          onClick={(e) => onTogglePin(item, e)}
          className="shrink-0 rounded-full p-1.5 transition-colors hover:bg-gray-200"
          title={item.isPinned ? 'Bỏ ghim' : 'Ghim thông báo'}
        >
          <Pin
            className={`h-4 w-4 transition-colors ${
              item.isPinned ? 'fill-amber-500 text-amber-500' : 'text-gray-400'
            }`}
          />
        </button>
      </div>

      <p className="mt-1 text-xs text-gray-600 line-clamp-2">{item.message}</p>

      <p className="mt-2 text-[10px] text-gray-400">{dayjs(item.createdAt).fromNow()}</p>
    </div>
  );
};
