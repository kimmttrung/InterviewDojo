import { Moon, Sun, LogOut, UserIcon } from 'lucide-react';
import { Button } from '../../../../shared/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../../shared/components/ui/dropdown-menu';

import { Avatar, AvatarImage, AvatarFallback } from '../../../../shared/components/ui/avatar';
import { useTheme } from '../../../../contexts/ThemeContext';

export function MentorNavbar() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStore = localStorage.getItem('user');
    if (userStore) {
      try {
        setUser(JSON.parse(userStore));
      } catch (err) {
        console.warn('Invalid user in localStorage, clearing...');
        localStorage.removeItem('user');
        setUser(null);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-6">
        {/* LOGO */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold">
            M
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

          {/* Avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 w-9 rounded-full">
                <Avatar>
                  <AvatarImage src={user?.avatarUrl} />
                  <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
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
