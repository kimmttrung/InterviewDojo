import { useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, Calendar, User, ClipboardList } from 'lucide-react';
import { cn } from '../../../lib/utils';

export function MentorSidebar() {
  const location = useLocation();

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/mentor/dashboard' },
    { label: 'Bookings', icon: ClipboardList, href: '/mentor/bookings' },
    { label: 'Schedule', icon: Calendar, href: '/mentor/schedule' },
    { label: 'Profile', icon: User, href: '/mentor/profile' },
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 border-r bg-background fixed left-0 top-16 bottom-0 shadow-sm">
      <nav className="flex-1 space-y-2 px-4 py-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className={cn('h-5 w-5', isActive ? 'text-white' : 'text-muted-foreground')} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
