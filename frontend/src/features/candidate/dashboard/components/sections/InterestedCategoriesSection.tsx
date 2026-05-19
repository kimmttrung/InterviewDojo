import { Skeleton } from '@/shared/components/ui/skeleton';
import { Card, CardContent } from '@/shared/components/ui/card';
import { useInterestedCategories } from '../../hooks/useInterestedCategories';
import { useCurrentUser } from '@/features/auth';
// ============================================================================
// 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU (Giả định cấu trúc từ API)
// ============================================================================
type InterestedCategory = {
  id: number;
  name: string;
  count: number;
};

// ============================================================================
// 2. COMPONENT THẺ DANH MỤC ĐƠN
// ============================================================================
type CategoryTagProps = {
  category: string;
};

const CategoryTag = ({ category }: CategoryTagProps) => {
  return (
    <div className="rounded-full border bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10">
      {category}
    </div>
  );
};

// ============================================================================
// 3. COMPONENT DANH SÁCH THẺ
// ============================================================================
type CategoryListProps = {
  categories: InterestedCategory[];
};

const CategoryList = ({ categories }: CategoryListProps) => {
  return (
    <div className="flex flex-wrap gap-3">
      {categories.map((category) => (
        <CategoryTag key={category.id} category={category.name} />
      ))}
    </div>
  );
};

// ============================================================================
// 4. COMPONENT GIAO DIỆN CHÍNH (Card Wrapper)
// ============================================================================
type InterestedCategoriesProps = {
  categories: InterestedCategory[];
};

const InterestedCategories = ({ categories }: InterestedCategoriesProps) => {
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

// ============================================================================
// 5. COMPONENT XỬ LÝ LOGIC VÀ XUẤT (Export)
// ============================================================================
export const InterestedCategoriesSection = () => {
  const { data: user } = useCurrentUser();
  const { data, isLoading, isError } = useInterestedCategories(user?.id);

  if (isLoading) {
    return (
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-52" />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-24 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
        Failed to load categories.
      </div>
    );
  }

  return <InterestedCategories categories={data} />;
};
