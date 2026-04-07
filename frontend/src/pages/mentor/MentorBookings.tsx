import { MentorLayout } from '../../../components/mentor/MentorLayout';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
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
const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleString('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

export default function MentorBookings() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

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
    {
      id: 3,
      name: 'Le C',
      role: 'Fullstack',
      time: '16:00 PM',
      status: 'rejected',
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
          <h1 className="text-3xl font-bold">Bookings</h1>
          <p className="text-muted-foreground">Manage all interview requests</p>
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
          {filtered.map((item) => {
            const statusUI = getStatusUI(item.status);

            return (
              <div
                key={item.id}
                className="flex items-center justify-between border p-4 rounded-xl hover:shadow-md transition"
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

                {/* RIGHT ACTION */}
                <div className="flex items-center gap-2">
                  {/* VIEW DETAIL */}
                  <Button size="icon" variant="outline" onClick={() => setSelectedBooking(item)}>
                    <Eye className="w-4 h-4" />
                  </Button>

                  {/* ACTIONS */}
                  {item.status === 'pending' && (
                    <>
                      <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white">
                        Accept
                      </Button>

                      <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white">
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </Card>
      </div>
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-background rounded-xl w-full max-w-lg p-6 shadow-xl animate-in fade-in zoom-in-95">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Booking Detail</h2>

              <button
                onClick={() => setSelectedBooking(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {/* CONTENT */}
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground">Name</p>
                <p className="font-medium">{selectedBooking.name}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Role</p>
                <p>{selectedBooking.role}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Time</p>
                <p>{selectedBooking.time}</p>
              </div>

              {/* ✅ PRICE */}
              <div>
                <p className="text-muted-foreground">Price</p>
                <p className="font-medium text-green-600">${selectedBooking.price || 0}</p>
              </div>

              {/* ✅ CREATED AT */}
              <div>
                <p className="text-muted-foreground">Created At</p>
                <p>{formatDate(selectedBooking.createdAt)}</p>
              </div>

              {/* ✅ UPDATED AT */}
              <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p>{formatDate(selectedBooking.updatedAt)}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="capitalize">{selectedBooking.status}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Note</p>
                <p className="text-muted-foreground">
                  {selectedBooking.note || 'No note provided'}
                </p>
              </div>
            </div>

            {/* ACTION */}
            {selectedBooking.status === 'pending' && (
              <div className="flex gap-2 mt-6">
                <Button className="w-full bg-green-500 hover:bg-green-600 text-white">
                  Accept
                </Button>

                <Button className="w-full bg-red-500 hover:bg-red-600 text-white">Reject</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </MentorLayout>
  );
}
