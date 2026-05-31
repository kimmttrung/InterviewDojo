import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

interface StatCardProps {
  label: string;
  value: number;
  delta?: number;
  valueClassName?: string;
}

export const StatCard = ({ label, value, delta, valueClassName }: StatCardProps) => {
  const renderDelta = () => {
    if (delta === undefined) return null;

    if (delta > 0) {
      return (
        <span className="flex items-center gap-1 text-xs text-green-600">
          <TrendingUp className="h-3 w-3" />+{delta}% so với T trước
        </span>
      );
    }

    if (delta < 0) {
      return (
        <span className="flex items-center gap-1 text-xs text-red-500">
          <TrendingDown className="h-3 w-3" />
          {delta}% so với T trước
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        Không đổi
      </span>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className={`text-3xl font-semibold ${valueClassName ?? ''}`}>
          {value.toLocaleString('vi-VN')}
        </p>
        {renderDelta()}
      </CardContent>
    </Card>
  );
};
