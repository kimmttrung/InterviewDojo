import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  HelpCircle,
  MessageSquare,
  BarChart3,
  User,
} from 'lucide-react';
import { cn } from '../lib/utils';

export function Sidebar() {
  const { t } = useTranslation();
  const location = useLocation();

  const menuItems = [
    {
      label: t('sidebar.dashboard'),
      icon: LayoutDashboard,
      href: '/dashboard',
    },
    {
      label: t('sidebar.practice'),
      icon: BookOpen,
      href: '/practice',
    },
    {
      label: t('sidebar.peerInterview'),
      icon: Users,
      href: '/peer-interview',
    },
    {
      label: t('sidebar.questionBank'),
      icon: HelpCircle,
      href: '/question-bank',
    },
    {
      label: t('sidebar.feedback'),
      icon: MessageSquare,
      href: '/feedback',
    },
    {
      label: t('sidebar.analytics'),
      icon: BarChart3,
      href: '/analytics',
    },
    {
      label: t('sidebar.profile'),
      icon: User,
      href: '/profile',
    },
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 border-r border-border bg-sidebar fixed left-0 top-16 bottom-0">
      <nav className="flex-1 space-y-1 px-4 py-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
