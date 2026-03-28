import { NavLink } from "react-router-dom";
import { LayoutDashboard, FileText, Users } from "lucide-react";

const menu = [
  { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Questions", path: "/admin/questions", icon: FileText },
  { name: "Users", path: "/admin/users", icon: Users },
];

export default function AdminSidebar() {
  return (
    <div className="w-64 bg-card border-r p-4">
      <h2 className="text-xl font-bold mb-6">Admin Panel</h2>

      <div className="space-y-2">
        {menu.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-lg ${
                  isActive ? "bg-primary text-white" : "hover:bg-muted"
                }`
              }
            >
              <Icon size={18} />
              {item.name}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}