import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun, Globe, LogOut, User } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/components/ui/avatar';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

export default function AdminHeader() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const [open, setOpen] = useState(false);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  const handleLogout = () => {
    clearAuth();
    queryClient.clear();
    navigate('/login');
  };

  return (
    <header className="border-b bg-background px-6 py-3 flex justify-between items-center">
      <div className="text-lg font-semibold text-foreground">
        {t('admin.welcome', { name: user?.name || 'Admin' })}
      </div>

      <div className="flex items-center gap-3">
        {/* Language */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Globe className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => changeLanguage('vi')}>Tiếng Việt</DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage('en')}>English</DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage('ja')}>日本語</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <div className="relative">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setOpen(!open)}>
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatarUrl} />
              <AvatarFallback className="bg-primary/10 text-xs">
                {user?.name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm hidden md:inline">{user?.email}</span>
          </div>
          {open && (
            <div className="absolute right-0 mt-2 w-48 bg-popover border rounded-md shadow-lg z-50">
              <button
                onClick={() => navigate('/admin/profile')}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-muted"
              >
                <User size={16} /> Profile
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-muted"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
