// features/mentor/dashboard/components/MentorNavbar.tsx
import { BanknoteArrowDown, LogOut, Moon, Sun, UserIcon, Wallet } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCurrentUser } from '@/features/auth';
import { useQueryClient } from '@tanstack/react-query';
import NotificationDropdown from '@/features/notifications/components/NotificationDropdown';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

import { Avatar, AvatarImage, AvatarFallback } from '@/shared/components/ui/avatar';

export function MentorNavbar() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Auth state
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { data: user } = useCurrentUser();

  const handleLogout = () => {
    clearAuth(); // xóa token + isAuthenticated
    queryClient.clear(); // xóa cache React Query
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-6">
        {/* LOGO */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold mx-auto mb-4 shadow-lg shadow-purple-500/30 transform rotate-12">
            <span className="text-xl -rotate-12">M</span>
          </div>
          <span className="font-semibold">Mentor Panel</span>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">
          {/* Theme */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                {theme === 'dark' ? <Moon /> : <Sun />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <NotificationDropdown />

          {/* Avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 w-9 rounded-full">
                <Avatar>
                  <AvatarImage src={user?.avatarUrl || undefined} />
                  <AvatarFallback>
                    {user?.email?.charAt(0).toUpperCase() ||
                      user?.name?.charAt(0).toUpperCase() ||
                      '?'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="z-50 w-72 bg-background border shadow-xl">
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-medium leading-none">{user?.name || 'Mentor'}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
              <div className="px-2 pb-2">
                <div className="mt-3 rounded-xl bg-muted/60 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-indigo-500" />
                      <span className="text-sm font-medium">Credits</span>
                    </div>
                    <span className="font-bold">{user?.creditBalance ?? 0}</span>
                  </div>

                  <Button
                    size="sm"
                    className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => navigate('/mentor/wallet')}
                  >
                    <BanknoteArrowDown className="mr-2 h-4 w-4" />
                    Mentor Wallet
                  </Button>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/mentor/profile')}>
                <UserIcon className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
