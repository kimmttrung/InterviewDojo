type CategoryTagProps = {
  category: string;
};

export const CategoryTag = ({ category }: CategoryTagProps) => {
  return (
    <div
      className="
        rounded-full
        border
        bg-primary/5
        px-4
        py-2
        text-sm
        font-medium
        text-primary
        transition-colors
        hover:bg-primary/10
      "
    >
      {category}
    </div>
  );
};
