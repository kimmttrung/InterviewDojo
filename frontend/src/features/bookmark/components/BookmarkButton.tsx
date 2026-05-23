import { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import { useBookmarkToggle } from '../hooks/useBookmarkToggle';

interface BookmarkButtonProps {
  questionId: number;
  isBookmarked: boolean;
}

export function BookmarkButton({
  questionId,
  isBookmarked: initialBookmarked,
}: BookmarkButtonProps) {
  const { toggleBookmark, isPending } = useBookmarkToggle();
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Optimistic update
    const newState = !isBookmarked;
    setIsBookmarked(newState);
    toggleBookmark(questionId, isBookmarked);
    // Nếu API thất bại, có thể rollback nhưng tạm thời bỏ qua
  };

  // Đồng bộ khi prop thay đổi (do cache update)
  useEffect(() => {
    setIsBookmarked(initialBookmarked);
  }, [initialBookmarked]);

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="flex items-center gap-1.5 text-sm font-bold hover:text-indigo-600 transition-colors disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isBookmarked ? (
        <BookmarkCheck className="w-4 h-4 fill-indigo-600 text-indigo-600" />
      ) : (
        <Bookmark className="w-4 h-4" />
      )}
      Save
    </button>
  );
}
