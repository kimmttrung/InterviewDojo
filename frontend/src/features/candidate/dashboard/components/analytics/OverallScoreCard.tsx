import { LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/shared/components/ui/card';

type OverallScoreCardProps = {
  score: number;
  icon: LucideIcon;
};

export const OverallScoreCard = ({ score, icon: Icon }: OverallScoreCardProps) => {
  return (
    <Card className="border-none bg-primary text-primary-foreground shadow-md">
      <CardContent className="flex items-center justify-between p-5">
        <div className="space-y-1">
          <p className="text-sm text-primary-foreground/80">Overall Score</p>

          <h3 className="text-3xl font-bold">{score}/10</h3>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
};
