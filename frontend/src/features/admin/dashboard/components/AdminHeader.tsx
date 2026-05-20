import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';

export default function AdminHeader() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const queryClient = useQueryClient();

  const changeLang = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const handleLogout = () => {
    clearAuth(); // xóa token + isAuthenticated
    queryClient.clear(); // xóa cache React Query
    navigate('/login');
  };

  return (
    <div className="flex justify-end items-center p-4 border-b bg-background gap-4">
      <select onChange={(e) => changeLang(e.target.value)} className="border rounded px-2 py-1">
        <option value="vi">VI</option>
        <option value="en">EN</option>
        <option value="ja">JP</option>
      </select>

      <div className="relative">
        <img
          src="https://i.pravatar.cc/40"
          className="w-10 h-10 rounded-full cursor-pointer"
          onClick={() => setOpen(!open)}
        />
        {open && (
          <div className="absolute right-0 mt-2 w-40 bg-white shadow rounded-lg p-2">
            {/* Bạn có thể liên kết đến trang profile thật */}
            <button className="block w-full text-left p-2 hover:bg-gray-100">Profile</button>
            <button
              onClick={handleLogout}
              className="block w-full text-left p-2 text-red-500 hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
