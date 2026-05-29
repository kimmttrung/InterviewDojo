import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from '../hooks/useNotifications';
import type { NotificationItem } from '../types/notification.types';
import { NotificationCard } from './NotificationCard';

export default function NotificationDropdown() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationAsRead();
  const markAllRead = useMarkAllNotificationsAsRead();

  const unreadItems = useMemo(() => {
    if (!data || !data.items) return [];
    return data.items.filter((item: NotificationItem) => !item.isRead);
  }, [data]);

  const handleClick = async (item: NotificationItem) => {
    await markRead.mutateAsync(item.id);

    setOpen(false);
    if (item.targetUrl) {
      navigate(item.targetUrl);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllRead.mutateAsync();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-full p-2 transition-colors hover:bg-gray-100"
      >
        <Bell className="h-5 w-5 text-gray-700" />

        {!!data?.unreadCount && data.unreadCount > 0 && (
          <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[10px] font-bold text-white">
            {data.unreadCount > 9 ? '9+' : data.unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 origin-top-right overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-800">Thông báo</h3>
            {unreadItems.length > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                <CheckCheck className="h-3 w-3" />
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          <div className="max-h-[350px] overflow-y-auto">
            {isLoading && <div className="p-4 text-center text-sm text-gray-500">Đang tải...</div>}

            {/* KIỂM TRA MẢNG UNREAD: Nếu mảng rỗng thì hiển thị chưa có thông báo */}
            {!isLoading && unreadItems.length === 0 && (
              <div className="p-8 text-center text-sm text-gray-500">
                Bạn chưa có thông báo mới nào
              </div>
            )}

            {/* RENDER MẢNG UNREAD */}
            {unreadItems.map((item: NotificationItem) => (
              <NotificationCard key={item.id} item={item} onClick={handleClick} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
