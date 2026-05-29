import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useTogglePinNotification,
} from '../hooks/useNotifications';
import type { NotificationItem } from '../types/notification.types';
import { NotificationCard } from './NotificationCard';

type FilterType = 'ALL' | 'UNREAD' | 'READ';

export default function NotificationDropdown() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>('ALL');

  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationAsRead();
  const markAllRead = useMarkAllNotificationsAsRead();
  const togglePin = useTogglePinNotification();

  // Xử lý logic Lọc và Sắp xếp (Ưu tiên ghim lên đầu)
  const displayItems = useMemo(() => {
    if (!data || !data.items) return [];

    let filtered = data.items;
    if (filter === 'UNREAD') {
      filtered = filtered.filter((item) => !item.isRead);
    } else if (filter === 'READ') {
      filtered = filtered.filter((item) => item.isRead);
    }

    // Sắp xếp: Pinned luôn nằm trên cùng
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });
  }, [data, filter]);

  const handleClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      await markRead.mutateAsync(item.id);
    }
    setOpen(false);
    if (item.targetUrl) {
      navigate(item.targetUrl);
    }
  };

  const handleTogglePin = async (item: NotificationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    await togglePin.mutateAsync(item.id);
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
        {!!data?.unreadCount && (
          <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[10px] font-bold text-white">
            {data.unreadCount > 10 ? '10+' : data.unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 origin-top-right overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
          <div className="border-b border-gray-100 bg-gray-50/50 p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-gray-800">Thông báo</h3>
              {data?.unreadCount ? (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 hover:underline"
                >
                  <CheckCheck className="h-3 w-3" />
                  Đánh dấu tất cả đã đọc
                </button>
              ) : null}
            </div>

            {/* BỘ LỌC TABS */}
            <div className="flex gap-2 rounded-lg bg-gray-200/50 p-1">
              {[
                { label: 'Tất cả', value: 'ALL' },
                { label: 'Chưa đọc', value: 'UNREAD' },
                { label: 'Đã đọc', value: 'READ' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilter(tab.value as FilterType)}
                  className={`flex-1 rounded-md py-1 text-xs font-medium transition-all ${
                    filter === tab.value
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[350px] overflow-y-auto">
            {isLoading && <div className="p-4 text-center text-sm text-gray-500">Đang tải...</div>}

            {!isLoading && displayItems.length === 0 && (
              <div className="p-8 text-center text-sm text-gray-500">
                {filter === 'UNREAD'
                  ? 'Bạn không có thông báo chưa đọc nào.'
                  : 'Bạn chưa có thông báo nào.'}
              </div>
            )}

            {displayItems.map((item: NotificationItem) => (
              <NotificationCard
                key={item.id}
                item={item}
                onClick={handleClick}
                onTogglePin={handleTogglePin}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
