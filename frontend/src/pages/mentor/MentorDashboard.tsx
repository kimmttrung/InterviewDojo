import { MentorLayout } from '../../../components/mentor/MentorLayout';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import { cn } from '../../../lib/utils';

const getStatusUI = (status: string) => {
  switch (status) {
    case 'pending':
      return {
        label: 'Pending',
        className: 'bg-yellow-100 text-yellow-700 border-yellow-300',
        icon: <Clock className="w-3 h-3 mr-1" />,
      };
    case 'accepted':
      return {
        label: 'Accepted',
        className: 'bg-green-100 text-green-700 border-green-300',
        icon: <CheckCircle className="w-3 h-3 mr-1" />,
      };
    case 'rejected':
      return {
        label: 'Rejected',
        className: 'bg-red-100 text-red-700 border-red-300',
        icon: <XCircle className="w-3 h-3 mr-1" />,
      };
    default:
      return { label: status, className: '', icon: null };
  }
};

export default function MentorDashboard() {
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const bookings = [
    {
      id: 1,
      name: 'Nguyen Van A',
      role: 'Frontend',
      time: '10:00 AM',
      status: 'pending',
    },
    {
      id: 2,
      name: 'Tran B',
      role: 'Backend',
      time: '14:00 PM',
      status: 'accepted',
    },
  ];

  const filtered = bookings.filter((b) => {
    const matchSearch = b.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || b.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <MentorLayout>
      <div className="p-6 space-y-6">
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold">Mentor Dashboard</h1>
          <p className="text-muted-foreground">
            View your booking requests and upcoming interviews
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 hover:shadow-md transition">
            <p className="text-sm text-muted-foreground">Total</p>
            <h2 className="text-2xl font-bold">24</h2>
          </Card>

          <Card className="p-4 hover:shadow-md transition">
            <p className="text-sm text-muted-foreground">Pending</p>
            <h2 className="text-2xl font-bold text-yellow-500">5</h2>
          </Card>

          <Card className="p-4 hover:shadow-md transition">
            <p className="text-sm text-muted-foreground">Accepted</p>
            <h2 className="text-2xl font-bold text-green-500">12</h2>
          </Card>

          <Card className="p-4 hover:shadow-md transition">
            <p className="text-sm text-muted-foreground">Rejected</p>
            <h2 className="text-2xl font-bold text-red-500">7</h2>
          </Card>
        </div>

        {/* FILTER */}
        <Card className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 justify-between">
            <Input
              placeholder="Search candidate..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="md:w-64"
            />

            <div className="flex gap-2 flex-wrap">
              {['all', 'pending', 'accepted', 'rejected'].map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={filter === f ? 'default' : 'outline'}
                  onClick={() => setFilter(f)}
                  className="capitalize"
                >
                  {f}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* LIST */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Booking Requests</h2>

          {filtered.map((item) => {
            const statusUI = getStatusUI(item.status);

            return (
              <div
                key={item.id}
                className="flex items-center justify-between border p-4 rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                {/* LEFT */}
                <div>
                  <p className="font-semibold">{item.name}</p>

                  <p className="text-sm text-muted-foreground">
                    {item.role} • {item.time}
                  </p>

                  <Badge
                    className={cn(
                      'mt-2 flex items-center w-fit border px-2 py-1 text-xs',
                      statusUI.className,
                    )}
                  >
                    {statusUI.icon}
                    {statusUI.label}
                  </Badge>
                </div>

                {/* RIGHT */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/mentor/bookings`)}
                  className="flex items-center gap-1"
                >
                  View Detail
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </Card>
      </div>
    </MentorLayout>
  );
}
