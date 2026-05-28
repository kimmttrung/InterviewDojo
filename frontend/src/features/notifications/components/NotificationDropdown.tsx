import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarkNotificationAsRead, useNotifications } from '../hooks/useNotifications';
import type { NotificationItem } from '../types/notification.types';
import { Bell } from 'lucide-react';

export default function NotificationDropdown() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationAsRead();

  const handleClick = async (item: NotificationItem) => {
    await markRead.mutateAsync(item.id);

    setOpen(false);

    if (item.targetUrl) {
      navigate(item.targetUrl);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-full p-2 hover:bg-gray-100 transition-colors"
      >
        <Bell className="h-5 w-5 text-gray-700" />

        {!!data?.unreadCount && (
          <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white">
            {data.unreadCount > 10 ? '10+' : data.unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50/50 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-800">Thông báo</h3>
          </div>

          <div className="max-h-[350px] overflow-y-auto">
            {isLoading && <div className="p-4 text-center text-sm text-gray-500">Đang tải...</div>}

            {!isLoading && !data?.items.length && (
              <div className="p-8 text-center text-sm text-gray-500">Chưa có thông báo mới</div>
            )}

            {data?.items.map((item: NotificationItem) => (
              <button
                type="button"
                key={item.id}
                onClick={() => handleClick(item)}
                className={`block w-full border-b border-gray-50 p-4 text-left transition-colors hover:bg-gray-50 last:border-0 ${
                  item.isRead ? 'bg-white' : 'bg-blue-50/40'
                }`}
              >
                <p
                  className={`text-sm ${item.isRead ? 'font-medium text-gray-700' : 'font-semibold text-gray-900'}`}
                >
                  {item.title}
                </p>
                <p className="mt-1 text-xs text-gray-500 line-clamp-2">{item.message}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
