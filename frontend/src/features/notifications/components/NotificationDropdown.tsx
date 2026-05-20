import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarkNotificationAsRead, useNotifications } from '../hooks/useNotifications';
import type { NotificationItem } from '../types/notification.types';

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
        className="relative rounded-full p-2 hover:bg-gray-100"
      >
        🔔
        {!!data?.unreadCount && (
          <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-xs text-white">
            {data.unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl bg-white shadow">
          {isLoading && <div className="p-3 text-sm text-gray-500">Đang tải...</div>}

          {!isLoading && !data?.items.length && (
            <div className="p-3 text-sm text-gray-500">Chưa có thông báo</div>
          )}

          {data?.items.map((item: NotificationItem) => (
            <button
              type="button"
              key={item.id}
              onClick={() => handleClick(item)}
              className={`block w-full p-3 text-left hover:bg-gray-50 ${
                item.isRead ? 'bg-white' : 'bg-blue-50'
              }`}
            >
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-gray-600">{item.message}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
