import { useTranslation } from 'react-i18next';
import {
  Moon,
  Sun,
  Globe,
  Search,
  Sparkles,
  UserIcon,
  LogOut,
  Wallet,
  CreditCard,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useCurrentUser } from '../../../features/auth/hooks/useCurrentUser';
import { useQueryClient } from '@tanstack/react-query';
import NotificationDropdown from '../../../features/notifications/components/NotificationDropdown';

export function Navbar() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Auth state từ Zustand
  const { isAuthenticated, clearAuth } = useAuthStore();

  // User data từ React Query (server state)
  const { data: user, isLoading: isUserLoading } = useCurrentUser();

  const menuItems = [
    { label: t('sidebar.dashboard'), href: '/dashboard' },
    { label: t('sidebar.practice'), href: '/practice' },
    { label: t('sidebar.questionBank'), href: '/question-bank' },
    { label: t('sidebar.mentor'), href: '/mentors' },
    { label: t('sidebar.booking'), href: '/bookings' },
  ];

  const handleLogout = () => {
    clearAuth(); // xóa token + isAuthenticated
    queryClient.clear(); // xóa toàn bộ cache React Query (bao gồm current-user)
    navigate('/login');
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  const languages = [
    { code: 'en', label: t('language.en') },
    { code: 'vi', label: t('language.vi') },
    { code: 'jp', label: t('language.jp') },
  ];

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-6 gap-6">
        {/* LOGO */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow">
            ID
          </div>

          <div className="hidden sm:flex flex-col">
            <Link to="/">
              <span className="text-sm font-bold text-foreground">{t('navbar.logo')}</span>
            </Link>

            {/* Hiển thị targetRole nếu có (từ user object) */}
            {user?.targetRole && (
              <Badge variant="secondary" className="w-fit text-xs">
                {user.targetRole}
              </Badge>
            )}
          </div>
        </div>

        {/* MENU */}
        <div className="hidden lg:flex items-center gap-6">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-2 text-sm font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* SEARCH */}
        <div className="hidden md:flex items-center relative w-64">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-9 bg-muted/50 border-none focus-visible:ring-1"
          />
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-3">
          {/* Upgrade */}
          <Button
            size="sm"
            className="hidden md:flex bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:opacity-90"
            onClick={() => navigate('/wallet')}
          >
            <Sparkles className="h-4 w-4 mr-1" />
            Upgrade
          </Button>

          {/* Language */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Globe className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={i18n.language === lang.code ? 'bg-accent' : ''}
                >
                  {lang.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                {theme === 'dark' ||
                (theme === 'system' && document.documentElement.classList.contains('dark')) ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                {t('theme.light')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                {t('theme.dark')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                {t('theme.system')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notification */}
          {isAuthenticated && <NotificationDropdown />}

          {/* Avatar / Auth buttons */}
          <div className="flex items-center gap-3 border-l pl-3 ml-2">
            {isAuthenticated ? (
              isUserLoading ? (
                <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-9 w-9 rounded-full border border-primary/10"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {user.email?.charAt(0).toUpperCase() ||
                            user.name?.charAt(0).toUpperCase() ||
                            '?'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    className="w-72 border bg-background backdrop-blur-none shadow-xl"
                  >
                    <div className="flex flex-col space-y-1 p-2">
                      <p className="text-sm font-medium leading-none">{user.name || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="px-2 pb-2">
                      <div className="mt-3 rounded-xl bg-muted/60 p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-indigo-500" />

                            <span className="text-sm font-medium">Credits</span>
                          </div>
                          <span className="font-bold">{user.creditBalance ?? 0}</span>
                        </div>

                        <Button
                          size="sm"
                          className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700"
                          onClick={() => navigate('/wallet')}
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          Nạp ví
                        </Button>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <UserIcon className="mr-2 h-4 w-4" />
                      {t('sidebar.profile')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-red-500 focus:text-red-500"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {t('sidebar.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                // Token có nhưng user không load được (có thể token hết hạn hoặc lỗi mạng)
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Error loading user</span>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    Log out
                  </Button>
                </div>
              )
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                  Log in
                </Button>
                <Button size="sm" onClick={() => navigate('/register')}>
                  Sign up
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
