import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Loader2, Star } from 'lucide-react';
import { useTopMentors } from '../hooks/useDashboard';

const RANK_COLORS: Record<number, string> = {
  1: 'bg-amber-100 text-amber-800',
  2: 'bg-gray-100 text-gray-600',
  3: 'bg-orange-100 text-orange-700',
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

export const TopMentorsTable = () => {
  const { data: mentors, isLoading } = useTopMentors();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Top mentors tháng này</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !mentors || mentors.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-muted-foreground">
            Chưa có dữ liệu tháng này
          </p>
        ) : (
          <ul>
            {mentors.map((mentor, idx) => (
              <li
                key={mentor.id}
                className={`flex items-center gap-3 px-6 py-3 ${
                  idx < mentors.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                {/* rank */}
                <span className="w-5 text-center text-xs font-medium text-muted-foreground">
                  {mentor.rank}
                </span>

                {/* avatar */}
                {mentor.avatarUrl ? (
                  <img
                    src={mentor.avatarUrl}
                    alt={mentor.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                      RANK_COLORS[mentor.rank] ?? 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {getInitials(mentor.name)}
                  </div>
                )}

                {/* name + meta */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{mentor.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {mentor.bookingCount} bookings
                    {mentor.avgRating !== null && (
                      <>
                        {' · '}
                        <Star className="mb-0.5 inline h-3 w-3 fill-amber-400 text-amber-400" />{' '}
                        {mentor.avgRating}
                      </>
                    )}
                  </p>
                </div>

                {/* top badge */}
                {mentor.rank === 1 && (
                  <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    🥇 Top
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
