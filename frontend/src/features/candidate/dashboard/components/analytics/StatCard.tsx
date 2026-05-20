import { LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/shared/components/ui/card';

type StatCardProps = {
  title: string;
  value: number | string;
  icon: LucideIcon;
};

export const StatCard = ({ title, value, icon: Icon }: StatCardProps) => {
  return (
    <Card className="border-none shadow-md">
      <CardContent className="flex items-center justify-between p-5">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>

          <h3 className="text-2xl font-bold">{value}</h3>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </CardContent>
    </Card>
  );
};
