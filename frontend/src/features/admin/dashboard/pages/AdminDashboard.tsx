// pages/admin/AdminDashboard.tsx

import AdminLayout from '../../../components/admin/AdminLayout';

import { Users, FileText, Activity, Code } from 'lucide-react';
import { Card } from '../../../components/ui/card';

const stats = [
  { label: 'Users', value: 1240, icon: Users },
  { label: 'Questions', value: 320, icon: FileText },
  { label: 'Mock Sessions', value: 890, icon: Activity },
  { label: 'Code Runs', value: 5400, icon: Code },
];

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Title */}
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <Card key={i} className="p-5 flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold">{s.value}</p>
                </div>
                <Icon className="w-6 h-6 text-primary" />
              </Card>
            );
          })}
        </div>

        {/* Fake Analytics */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">System Overview</h2>
          <ul className="space-y-2 text-sm">
            <li>🟢 AI API: Healthy</li>
            <li>🟢 Judge0: Running</li>
            <li>🟡 WebRTC: Slight delay</li>
          </ul>
        </Card>
      </div>
    </AdminLayout>
  );
}
