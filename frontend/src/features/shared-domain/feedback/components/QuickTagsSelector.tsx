// shared-domain/feedback/components/QuickTagsSelector.tsx
import { cn } from '@/shared/lib/utils';

const QUICK_TAGS = ['Nhiệt tình', 'Đúng giờ', 'Chuyên môn cao', 'Dễ hiểu', 'Tài liệu hữu ích'];

interface Props {
  selected: string[];
  onChange: (tags: string[]) => void;
}

export const QuickTagsSelector = ({ selected, onChange }: Props) => {
  const toggle = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_TAGS.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => toggle(tag)}
          className={cn(
            'px-3 py-1 rounded-full text-sm transition-colors',
            selected.includes(tag)
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
          )}
        >
          {tag}
        </button>
      ))}
    </div>
  );
};
