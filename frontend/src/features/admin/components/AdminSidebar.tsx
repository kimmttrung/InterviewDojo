import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCheck,
  Users,
  Flag,
  BookOpen,
  Layers,
  Building2,
  Briefcase,
  TrendingUp,
  Receipt,
  WalletCards,
} from 'lucide-react';

const menuItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/mentors', label: 'Mentors', icon: UserCheck },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/reports', label: 'Reports', icon: Flag },
  { path: '/admin/questions', label: 'Questions', icon: BookOpen },
  { path: '/admin/coaching-categories', label: 'Coaching Categories', icon: Layers },
  { path: '/admin/companies', label: 'Companies', icon: Building2 }, // mới
  { path: '/admin/job-roles', label: 'Job Roles', icon: Briefcase },

  { path: '/admin/wallet-statistics', label: 'Thống kê ví', icon: TrendingUp },
  { path: '/admin/transactions', label: 'Giao dịch', icon: Receipt },
  { path: '/admin/mentor-payouts', label: 'Thanh toan mentor', icon: WalletCards },
];

export default function AdminSidebar() {
  return (
    <aside className="w-64 bg-card border-r flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold text-primary">Admin Panel</h2>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
