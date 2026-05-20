import { Card, CardContent } from '@/shared/components/ui/card';

import { CategoryList } from './CategoryList';

type InterestedCategoriesProps = {
  categories: string[];
};

export const InterestedCategories = ({ categories }: InterestedCategoriesProps) => {
  return (
    <Card className="border-none shadow-md">
      <CardContent className="space-y-6 p-6">
        <div>
          <h2 className="text-lg font-semibold">Interested Categories</h2>

          <p className="text-sm text-muted-foreground">Topics you are focusing on recently</p>
        </div>

        <CategoryList categories={categories} />
      </CardContent>
    </Card>
  );
};
