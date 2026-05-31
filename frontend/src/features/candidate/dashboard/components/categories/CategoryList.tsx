import { CategoryTag } from './CategoryTag';

type CategoryListProps = {
  categories: string[];
};

export const CategoryList = ({ categories }: CategoryListProps) => {
  return (
    <div className="flex flex-wrap gap-3">
      {categories.map((category) => (
        <CategoryTag key={category} category={category} />
      ))}
    </div>
  );
};
